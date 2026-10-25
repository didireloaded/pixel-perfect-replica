import {Unzip,UnzipInflate} from 'fflate';
const TEXT_LIMIT=2*1024*1024;
const ZIP_LIMIT=50*1024*1024;
function decode(bytes){try{return new TextDecoder('utf-8',{fatal:true}).decode(bytes).replace(/^\uFEFF/,'');}catch{throw new Error('The chat text must use UTF-8 encoding. Try exporting it again.');}}
export function extractChat(bytes){
 if(bytes[0]!==0x50||bytes[1]!==0x4b)throw new Error('This file isn’t a valid ZIP archive.');
 const entries=[];let failure;let count=0;
 try{
  const unzip=new Unzip(entry=>{if(++count>10000)throw new Error('This ZIP contains too many files. Export the chat without media.');if(!entry.name.startsWith('__MACOSX/')&&!entry.name.split('/').some(p=>p.startsWith('.'))&&/\.txt$/i.test(entry.name))entries.push(entry);});
  unzip.register(UnzipInflate);
  for(let i=0;i<bytes.length;i+=4096)unzip.push(bytes.subarray(i,i+4096),i+4096>=bytes.length);
  const preferred=entries.filter(e=>/(^|\/)_(?:chat)\.txt$/i.test(e.name));
  const candidates=preferred.length?preferred:entries;
  if(!candidates.length)throw new Error('No chat text found in this ZIP. Choose a WhatsApp export containing a .txt file.');
  if(candidates.length!==1)throw new Error('This ZIP contains multiple chat files. Choose a single-chat export or import its .txt file.');
  const entry=candidates[0];
  if(entry.originalSize>TEXT_LIMIT)throw new Error('The chat text exceeds 2 MB. Export a shorter conversation.');
  const chunks=[];let length=0;let complete=false;
  entry.ondata=(err,data,final)=>{if(err){failure=new Error('This ZIP is damaged, encrypted, or unsupported. Export it again.');return;}length+=data.length;if(length>TEXT_LIMIT){failure=new Error('The chat text exceeds 2 MB. Export a shorter conversation.');entry.terminate();return;}chunks.push(data);if(final)complete=true;};
  entry.start();
  if(failure)throw failure;
  if(!complete||(entry.originalSize!==undefined&&entry.originalSize!==length))throw new Error('The chat file is incomplete. Export the ZIP again.');
  const output=new Uint8Array(length);let offset=0;for(const chunk of chunks){output.set(chunk,offset);offset+=chunk.length;}
  const text=decode(output);if(!text.trim())throw new Error('The chat text file is empty.');
  return {text,name:entry.name.split('/').pop()};
 }catch(error){if(error instanceof Error&&/chat|ZIP|UTF-8/i.test(error.message))throw error;throw new Error('This ZIP is damaged, encrypted, or unsupported. Export it again.');}
}
export async function readChatFile(file){
 const zip=/\.zip$/i.test(file.name);if(!zip&&!/\.txt$/i.test(file.name))throw new Error('Choose a WhatsApp .zip or .txt export.');
 if(file.size>(zip?ZIP_LIMIT:TEXT_LIMIT))throw new Error(zip?'The ZIP exceeds 50 MB. Export the chat without media.':'The chat text exceeds 2 MB.');
 const bytes=new Uint8Array(await file.arrayBuffer());
 if(zip)return extractChat(bytes);
 const text=decode(bytes);if(!text.trim())throw new Error('The chat text file is empty.');return {text,name:file.name};
}
