const fs=require('fs');const storage={};
global.localStorage={getItem:k=>storage[k]??null,setItem:(k,v)=>{storage[k]=String(v)},removeItem:k=>{delete storage[k]},clear:()=>{}};
global.window={location:{hash:''},addEventListener:()=>{},scrollTo:()=>{}};
global.document={createElement:()=>({textContent:'',innerHTML:'',appendChild:()=>{},setAttribute:()=>{},classList:{add:()=>{},remove:()=>{}},addEventListener:()=>{}}),body:{appendChild:()=>{},removeChild:()=>{}},getElementById:()=>null,querySelectorAll:()=>[]};
let c=fs.readFileSync('src/utils/helpers.js','utf8').replace(/^const Helpers =/m,'global.Helpers =');eval(c);
c=fs.readFileSync('src/data/store.js','utf8').replace(/^const ATSStore =/m,'global.ATSStore =');eval(c);
const tests=[
 'SĐT: 0978123456',
 'Điện thoại: 0909 678 123',
 'Phone: 0912.345.678',
 'SĐT: +84 912 345 678',
 'Tel: 0123456789 (số cũ 11 số)',
 'ĐT: 024 3123 4567 (máy bàn)',
 'Liên hệ | (0912) 345 678',
 'Số điện thoại: 0903123456 - Email: a@b.com',
];
for(const t of tests){ const r=ATSStore.parseCVText('Họ tên: Nguyễn Văn A\n'+t); console.log(JSON.stringify(t), '=> phone=', JSON.stringify(r.phone)); }
const sample=fs.readFileSync('sample-data/cv-mau-tran-thi-minh-thu.txt','utf8');
console.log('\n--- CV mau TXT => phone =', JSON.stringify(ATSStore.parseCVText(sample).phone));
