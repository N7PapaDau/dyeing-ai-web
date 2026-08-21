let allCases = [];
let currentCase = null;
let cachedActions = {};

const cfg = window.DYEING_CONFIG || {};
const isSupabase = !!(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY);
const DEMO_KEY = "dyeing_ai_cases_v1";

document.getElementById("date").value = new Date().toISOString().slice(0,10);
document.getElementById("mode").textContent = isSupabase ? "● Shared Database Mode" : "● Demo Browser Mode";

document.querySelectorAll(".nav").forEach(button => {
  button.onclick = () => {
    showPage(button.dataset.page);
    if (button.dataset.page === "cases") loadCases();
  };
});

function showPage(pageId){
  document.querySelectorAll(".nav").forEach(x => x.classList.remove("active"));
  document.querySelectorAll(".page").forEach(x => x.classList.remove("active"));
  const page = document.getElementById(pageId);
  if(page) page.classList.add("active");
  const navButton = document.querySelector(`.nav[data-page="${pageId}"]`);
  if(navButton) navButton.classList.add("active");
}

function localGet(){
  try { return JSON.parse(localStorage.getItem(DEMO_KEY) || "[]"); }
  catch { return []; }
}
function localSave(data){ localStorage.setItem(DEMO_KEY, JSON.stringify(data)); }

async function supa(path, options = {}){
  const headers = {
    "apikey": cfg.SUPABASE_ANON_KEY,
    "Content-Type": "application/json",
    "Prefer": "return=representation",
    ...(options.headers || {})
  };
  const response = await fetch(cfg.SUPABASE_URL + "/rest/v1/" + path, {...options, headers});
  if(!response.ok){
    const text = await response.text();
    throw new Error(`Supabase ${response.status}: ${text}`);
  }
  return response.status === 204 ? [] : await response.json();
}

document.getElementById("caseForm").onsubmit = async function(event){
  event.preventDefault();
  const id = "CASE-" + Date.now();
  const record = {
    case_id:id,
    product_code:document.getElementById("product").value.trim(),
    batch_no:document.getElementById("batch").value.trim(),
    machine:document.getElementById("machine").value.trim(),
    event_date:document.getElementById("date").value,
    problem:document.getElementById("problem").value,
    description:document.getElementById("description").value.trim(),
    status:"OPEN",
    treatment:null,
    result:null,
    effective:null,
    next_action:null,
    created_by:"Worker",
    created_at:new Date().toISOString()
  };
  const message = document.getElementById("saveMsg");
  try{
    if(isSupabase) await supa("dyeing_cases",{method:"POST",body:JSON.stringify(record)});
    else { const data = localGet(); data.unshift(record); localSave(data); }
    message.className="success";
    message.textContent="✓ Đã lưu " + id;
    event.target.reset();
    document.getElementById("date").value=new Date().toISOString().slice(0,10);
    allCases = [];
  }catch(error){
    console.error(error);
    message.className="error";
    message.textContent="Không lưu được: " + error.message;
  }
};

async function loadCases(){
  const box=document.getElementById("caseList");
  box.innerHTML="Đang tải...";
  try{
    allCases = isSupabase
      ? await supa("dyeing_cases?select=*&order=created_at.desc")
      : localGet();
    renderCaseList(allCases,box);
  }catch(error){
    console.error(error);
    box.innerHTML=`<div class="error">${esc(error.message)}</div>`;
  }
}

function renderCaseList(rows,box){
  if(!rows.length){box.innerHTML="<p>Chưa có Case.</p>";return;}
  box.innerHTML=rows.map(x=>`
    <article class="case">
      <h3>${esc(x.case_id)} — ${esc(x.product_code)}</h3>
      <span class="tag">Batch: ${esc(x.batch_no)}</span>
      <span class="tag">${esc(x.machine)}</span>
      <span class="tag">${esc(x.problem)}</span>
      <p><b>Hiện tượng:</b> ${esc(x.description)}</p>
      <p><b>Trạng thái:</b> <span class="status">${esc(x.status || "OPEN")}</span></p>
      <button onclick="openCase('${esc(x.case_id)}')">🔧 Xem / cập nhật xử lý</button>
    </article>
  `).join("");
}

async function openCase(caseId){
  try{
    let found=allCases.find(x=>x.case_id===caseId);
    if(!found && isSupabase){
      const result=await supa(`dyeing_cases?case_id=eq.${encodeURIComponent(caseId)}&select=*`);
      found=result[0];
    }
    if(!found){alert("Không tìm thấy Case.");return;}
    currentCase=found;
    showPage("caseDetail");
    document.getElementById("detailCaseTitle").textContent=`${found.case_id} — ${found.product_code}`;
    document.getElementById("caseInformation").innerHTML=`
      <div class="case">
        <p><b>Product:</b> ${esc(found.product_code)}</p>
        <p><b>Batch:</b> ${esc(found.batch_no)}</p>
        <p><b>Machine:</b> ${esc(found.machine)}</p>
        <p><b>Ngày:</b> ${esc(found.event_date)}</p>
        <p><b>Vấn đề:</b> ${esc(found.problem)}</p>
        <p><b>Hiện tượng:</b> ${esc(found.description)}</p>
        <p><b>Trạng thái:</b> ${esc(found.status || "OPEN")}</p>
      </div>`;
    await loadActions(found.case_id);
  }catch(error){ console.error(error); alert("Không mở được Case: " + error.message); }
}

async function getActions(caseId){
  if(cachedActions[caseId]) return cachedActions[caseId];
  let actions=[];
  if(isSupabase){
    actions=await supa(`case_actions?case_id=eq.${encodeURIComponent(caseId)}&select=*&order=action_no.asc`);
  }else{
    const key="dyeing_ai_actions_v2_"+caseId;
    try{actions=JSON.parse(localStorage.getItem(key)||"[]");}catch{actions=[];}
  }
  cachedActions[caseId]=actions;
  return actions;
}

async function loadActions(caseId){
  const box=document.getElementById("actionList");
  box.innerHTML="Đang tải lịch sử xử lý...";
  try{
    const actions=await getActions(caseId);
    if(!actions.length){box.innerHTML='<p class="hint">Chưa có lần xử lý nào.</p>';return;}
    box.innerHTML=actions.map(action=>{
      const icon=action.result==="Không đạt"?"❌":action.result==="Cải thiện"?"🟡":action.result==="Đạt"?"🟢":"⚪";
      return `<article class="case">
        <h3>Lần xử lý ${esc(action.action_no)}</h3>
        <p><b>Phương pháp:</b> ${esc(action.treatment)}</p>
        <p><b>Kết quả:</b> ${icon} ${esc(action.result)}</p>
        ${action.notes?`<p><b>Ghi chú:</b> ${esc(action.notes)}</p>`:""}
        ${action.confirm_batch_no?`<p><b>Mẻ xác nhận:</b> ${esc(action.confirm_batch_no)}</p>`:""}
        ${action.effective?`<p class="ok"><b>⭐ Phương pháp hiệu quả đã xác nhận</b></p>`:""}
        <p class="hint">Người thực hiện: ${esc(action.created_by || "Worker")}</p>
      </article>`;
    }).join("");
  }catch(error){
    console.error(error);
    box.innerHTML=`<div class="error">Không tải được lịch sử: ${esc(error.message)}</div>`;
  }
}

function openActionForm(){
  if(!currentCase){alert("Vui lòng mở một Case trước.");return;}
  document.getElementById("actionFormBox").style.display="block";
  document.getElementById("actionTreatment").focus();
}
function closeActionForm(){
  document.getElementById("actionFormBox").style.display="none";
  document.getElementById("actionForm").reset();
  document.getElementById("actionSaveMsg").textContent="";
}

document.getElementById("actionForm").onsubmit=async function(event){
  event.preventDefault();
  if(!currentCase){alert("Không xác định được Case.");return;}
  const message=document.getElementById("actionSaveMsg");
  try{
    const existing=await getActions(currentCase.case_id);
    const nextActionNo=existing.length
      ? Math.max(...existing.map(x=>Number(x.action_no)||0))+1 : 1;
    const treatment=document.getElementById("actionTreatment").value.trim();
    const result=document.getElementById("actionResult").value;
    const notes=document.getElementById("actionNotes").value.trim();
    const confirmBatch=document.getElementById("confirmBatch").value.trim();
    const effective=document.getElementById("actionEffective").checked;

    if(effective && !confirmBatch){
      message.className="error";
      message.textContent="⚠️ Vui lòng nhập Mẻ xác nhận trước khi xác nhận phương pháp hiệu quả.";
      return;
    }

    const record={
      case_id:currentCase.case_id,
      action_no:nextActionNo,
      treatment,
      result,
      notes:notes||null,
      effective,
      confirm_batch_no:confirmBatch||null,
      created_by:"Worker",
      created_at:new Date().toISOString(),
      updated_at:new Date().toISOString()
    };

    if(isSupabase){
      await supa("case_actions",{method:"POST",body:JSON.stringify(record)});
      if(effective){
        await supa(`dyeing_cases?case_id=eq.${encodeURIComponent(currentCase.case_id)}`,{
          method:"PATCH",
          body:JSON.stringify({
            status:"CONFIRMED",
            treatment:treatment,
            result:result,
            effective:true,
            next_action:"Continue monitoring"
          })
        });
      }
    }else{
      const key="dyeing_ai_actions_v2_"+currentCase.case_id;
      const actions=[...(cachedActions[currentCase.case_id]||[]),record];
      localStorage.setItem(key,JSON.stringify(actions));
    }

    cachedActions[currentCase.case_id]=[
      ...(cachedActions[currentCase.case_id]||[]),record
    ];

    message.className="success";
    message.textContent=`✓ Đã lưu lần xử lý ${nextActionNo}`;
    document.getElementById("actionForm").reset();
    await loadActions(currentCase.case_id);

    if(effective){
      currentCase.status="CONFIRMED";
      currentCase.treatment=treatment;
      currentCase.result=result;
      currentCase.effective=true;
    }

    setTimeout(closeActionForm,900);
  }catch(error){
    console.error(error);
    message.className="error";
    message.textContent="Không lưu được: " + error.message;
  }
};

async function runAISearch(){
  const query=document.getElementById("aiQuery").value.trim();
  const interpretation=document.getElementById("aiInterpretation");
  const result=document.getElementById("aiResult");
  interpretation.innerHTML="";
  result.innerHTML="";

  if(!query){
    interpretation.innerHTML='<div class="error">⚠️ Vui lòng nhập câu hỏi.</div>';
    return;
  }

  try{
    if(!allCases.length){
      allCases=isSupabase
        ? await supa("dyeing_cases?select=*&order=created_at.desc")
        : localGet();
    }

    const intent=detectIntent(query);
    const scope=parseScope(query,allCases);

    interpretation.innerHTML=`
      <div class="interpretation">
        <b>AI hiểu câu hỏi:</b><br>
        <span class="chip strong">Intent: ${esc(intent.label)}</span>
        <span class="chip ${scope.scopeType==="UNKNOWN"?"warn":"strong"}">Scope: ${esc(scope.label)}</span>
        ${scope.product?`<span class="chip">Product: ${esc(scope.product)}</span>`:""}
        ${scope.problem?`<span class="chip">Problem: ${esc(scope.problem)}</span>`:""}
        ${scope.batch?`<span class="chip">Batch: ${esc(scope.batch)}</span>`:""}
      </div>
    `;

    if(scope.scopeType==="UNKNOWN"){
      result.innerHTML=`
        <div class="ai-answer">
          <div class="ai-title">⚠️ Chưa đủ thông tin để chọn đúng Case</div>
          <p>Tôi không tự lấy dữ liệu mặc định.</p>
          <p>Hãy cho biết <b>Product, Problem hoặc Batch</b>.</p>
          <p>Ví dụ: <i>“SCO bị Uneven Dyeing trước đây xử lý thế nào?”</i></p>
        </div>`;
      return;
    }

    const matches=filterCasesByScope(allCases,scope);

    if(!matches.length){
      result.innerHTML=`
        <div class="ai-answer">
          <div class="ai-title">🔎 Không tìm thấy Case phù hợp</div>
          <p>Phạm vi đã xác định: <b>${esc(scope.label)}</b></p>
          <p>AI không tự mở rộng sang sản phẩm/Batch khác.</p>
        </div>`;
      return;
    }

    if(matches.length>1 && !scope.batch){
      result.innerHTML=`
        <div class="ai-answer">
          <div class="ai-title">📋 Có ${matches.length} Case phù hợp</div>
          <p>Chưa có Batch cụ thể. Hãy chọn Case bạn muốn xem.</p>
          ${matches.map(x=>`
            <article class="case">
              <h3>${esc(x.case_id)} — ${esc(x.product_code)}</h3>
              <span class="tag">Batch: ${esc(x.batch_no)}</span>
              <span class="tag">${esc(x.problem)}</span>
              <p>${esc(x.description)}</p>
              <button onclick="openCase('${esc(x.case_id)}')">🔧 Xem lịch sử xử lý</button>
            </article>`).join("")}
        </div>`;
      return;
    }

    const selected=matches[0];
    const actions=await getActions(selected.case_id);
    const summary=summarizeActions(actions);

    result.innerHTML=`
      <div class="ai-answer">
        <div class="ai-title">✅ Case được chọn</div>
        <p><b>${esc(selected.case_id)}</b> — ${esc(selected.product_code)}</p>
        <span class="metric">Batch: ${esc(selected.batch_no)}</span>
        <span class="metric">Problem: ${esc(selected.problem)}</span>
        <span class="metric">Status: ${esc(selected.status || "OPEN")}</span>

        <h4>📚 Lịch sử xử lý</h4>
        ${summary.historyHtml || "<p>Chưa có Action được ghi nhận.</p>"}

        <h4>⭐ Phương pháp đã xác nhận</h4>
        ${summary.confirmedHtml || "<p>Chưa có phương pháp nào được xác nhận hiệu quả.</p>"}

        <h4>🤖 Kết luận từ dữ liệu</h4>
        <p>${esc(summary.conclusion)}</p>

        <button onclick="openCase('${esc(selected.case_id)}')">🔧 Mở Case đầy đủ</button>
      </div>`;
  }catch(error){
    console.error(error);
    result.innerHTML=`<div class="error">Không thể tra cứu: ${esc(error.message)}</div>`;
  }
}

function detectIntent(query){
  const n=normalize(query);
  if(/mẻ tiếp theo|tiếp theo|nên thử|nên tham khảo|đề xuất|recommend/.test(n))
    return {type:"NEXT_ACTION",label:"Đề xuất cho mẻ tiếp theo"};
  if(/đã đạt|đạt ok|phương pháp nào.*hiệu quả|hiệu quả|successful/.test(n))
    return {type:"FIND_EFFECTIVE",label:"Tìm phương pháp đã hiệu quả"};
  if(/không đạt|đã ng|thất bại|không hiệu quả|failed/.test(n))
    return {type:"FIND_FAILED",label:"Tìm phương pháp chưa đạt"};
  if(/tại sao|vì sao|nguyên nhân|root cause|why/.test(n))
    return {type:"ANALYZE",label:"Phân tích / tìm nguyên nhân"};
  if(/xử lý|lịch sử|trước đây|đã từng|history|how/.test(n))
    return {type:"HISTORY",label:"Tìm lịch sử xử lý"};
  return {type:"GENERAL",label:"Tìm kiếm thông tin"};
}

function parseScope(query,cases){
  const n=normalize(query);
  const batchMatch=query.match(/\b\d{6,}\b/);
  const batch=batchMatch ? batchMatch[0] : null;

  let product=null;
  let problem=null;

  const products=[...new Set(cases.map(x=>x.product_code).filter(Boolean))];
  const problems=[...new Set(cases.map(x=>x.problem).filter(Boolean))];

  for(const p of products){
    if(normalize(p) && n.includes(normalize(p))) { product=p; break; }
  }
  for(const p of problems){
    if(normalize(p) && n.includes(normalize(p))) { problem=p; break; }
  }

  if(batch){
    return {scopeType:"BATCH",label:`Batch ${batch}`,batch,product,problem};
  }
  if(product && problem){
    return {scopeType:"PRODUCT_PROBLEM",label:`${product} + ${problem}`,product,problem};
  }
  if(product){
    return {scopeType:"PRODUCT",label:`Product ${product}`,product};
  }
  if(problem){
    return {scopeType:"PROBLEM",label:`Problem ${problem}`,problem};
  }
  return {scopeType:"UNKNOWN",label:"Chưa xác định"};
}

function filterCasesByScope(cases,scope){
  return cases.filter(x=>{
    if(scope.batch && String(x.batch_no).toLowerCase()!==scope.batch.toLowerCase()) return false;
    if(scope.product && normalize(x.product_code)!==normalize(scope.product)) return false;
    if(scope.problem && normalize(x.problem)!==normalize(scope.problem)) return false;
    return true;
  });
}

function summarizeActions(actions){
  const historyHtml=actions.length ? actions.map(a=>{
    const icon=a.result==="Không đạt"?"❌":a.result==="Cải thiện"?"🟡":a.result==="Đạt"?"🟢":"⚪";
    return `<div class="case">
      <b>Lần ${esc(a.action_no)}</b> — ${esc(a.treatment)}
      <br>Kết quả: ${icon} ${esc(a.result)}
      ${a.confirm_batch_no?`<br>Mẻ xác nhận: ${esc(a.confirm_batch_no)}`:""}
      ${a.effective?`<br><span class="ok">⭐ Đã xác nhận hiệu quả</span>`:""}
    </div>`;
  }).join("") : "";

  const confirmed=actions.filter(a=>a.effective===true);
  const confirmedHtml=confirmed.length
    ? confirmed.map(a=>`<div class="case"><b>${esc(a.treatment)}</b><br>Mẻ xác nhận: ${esc(a.confirm_batch_no || "Không ghi nhận")}</div>`).join("")
    : "";

  let conclusion="Dữ liệu hiện tại chỉ cho phép tóm tắt lịch sử đã ghi nhận; chưa đủ bằng chứng để kết luận nguyên nhân gốc.";
  if(confirmed.length){
    conclusion=`Có ${confirmed.length} phương pháp đã được xác nhận hiệu quả trong lịch sử. AI chỉ xem đây là bằng chứng lịch sử, không tự suy ra nguyên nhân gốc.`;
  }
  return {historyHtml,confirmedHtml,conclusion};
}

function normalize(value){
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"")
    .replace(/đ/g,"d")
    .trim();
}

function esc(value){
  return String(value ?? "").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
}

loadCases();
