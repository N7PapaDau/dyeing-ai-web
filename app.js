let allCases = [];
const cfg = window.DYEING_CONFIG || {};
const isSupabase = !!(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY);
const DEMO_KEY = "dyeing_ai_cases_v1";

document.getElementById("date").value = new Date().toISOString().slice(0,10);
document.getElementById("mode").textContent = isSupabase ? "● Shared Database Mode" : "● Demo Browser Mode";

document.querySelectorAll(".nav").forEach(b=>b.onclick=()=>{
  document.querySelectorAll(".nav").forEach(x=>x.classList.remove("active"));
  document.querySelectorAll(".page").forEach(x=>x.classList.remove("active"));
  b.classList.add("active"); document.getElementById(b.dataset.page).classList.add("active");
  if(b.dataset.page==="cases") loadCases();
});

function localGet(){try{return JSON.parse(localStorage.getItem(DEMO_KEY)||"[]")}catch{return[]}}
function localSave(x){localStorage.setItem(DEMO_KEY,JSON.stringify(x))}

async function supa(path, options={}){
  const r=await fetch(cfg.SUPABASE_URL+"/rest/v1/"+path,{
    ...options, headers:{"apikey":cfg.SUPABASE_ANON_KEY,"Authorization":"Bearer "+cfg.SUPABASE_ANON_KEY,"Content-Type":"application/json","Prefer":"return=representation",...(options.headers||{})}
  });
  if(!r.ok) throw new Error(await r.text()); return r.status===204?[]:r.json();
}

document.getElementById("caseForm").onsubmit=async e=>{
  e.preventDefault();
  const id="CASE-"+Date.now();
  const record={
    case_id:id, product_code:product.value.trim(), batch_no:batch.value.trim(),
    machine:machine.value.trim(), event_date:date.value, problem:problem.value,
    description:description.value.trim(), status:"OPEN", treatment:null,
    result:null, effective:null, next_action:null, created_by:"Worker", created_at:new Date().toISOString()
  };
  const msg=document.getElementById("saveMsg");
  try{
    if(isSupabase) await supa("dyeing_cases",{method:"POST",body:JSON.stringify(record)});
    else {let x=localGet();x.unshift(record);localSave(x)}
    msg.className="success";msg.textContent="✓ Đã lưu "+id;
    e.target.reset();date.value=new Date().toISOString().slice(0,10);
  }catch(err){msg.className="error";msg.textContent="Không lưu được: "+err.message}
};

async function loadCases(){
  const box=document.getElementById("caseList"); box.innerHTML="Đang tải...";
  try{
    allCases=isSupabase?await supa("dyeing_cases?select=*&order=created_at.desc"):localGet();
    render(allCases,box);
  }catch(err){box.innerHTML='<div class="error">'+err.message+"</div>"}
}
function render(rows,box){
  if(!rows.length){box.innerHTML="<p>Chưa có Case.</p>";return}
  box.innerHTML=rows.map(x=>`<article class="case">
    <h3>${esc(x.case_id)} — ${esc(x.product_code)}</h3>
    <span class="tag">Batch: ${esc(x.batch_no)}</span><span class="tag">${esc(x.machine)}</span>
    <span class="tag">${esc(x.problem)}</span>
    <p><b>Hiện tượng:</b> ${esc(x.description)}</p>
    <p><b>Trạng thái:</b> <span class="status">${esc(x.status||"OPEN")}</span></p>
  </article>`).join("");
}
async function runSearch(){
  const q=document.getElementById("searchBox").value.trim().toLowerCase();
  if(!allCases.length) allCases=isSupabase?await supa("dyeing_cases?select=*&order=created_at.desc"):localGet();
  const rows=allCases.filter(x=>Object.values(x).join(" ").toLowerCase().includes(q));
  render(rows,document.getElementById("searchResult"));
}
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
loadCases();
