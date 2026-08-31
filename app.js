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
    if (button.dataset.page === "dashboard") loadDashboard();
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




function setAIQuery(value){
  const input = document.getElementById("aiQuery");
  if(input){
    input.value = value;
    input.focus();
  }
}

async function getAllActionsForCases(cases){
  const map = {};
  for(const c of cases){
    try{
      map[c.case_id] = await getActions(c.case_id);
    }catch(error){
      console.error("Action load failed", c.case_id, error);
      map[c.case_id] = [];
    }
  }
  return map;
}

function scoreSimilarCase(target, candidate){
  let score = 0;

  const targetProduct = normalize(target.product_code);
  const candidateProduct = normalize(candidate.product_code);
  const targetProblem = normalize(target.problem);
  const candidateProblem = normalize(candidate.problem);
  const targetMachine = normalize(target.machine);
  const candidateMachine = normalize(candidate.machine);

  if(targetProduct && candidateProduct && targetProduct === candidateProduct) score += 60;
  if(targetProblem && candidateProblem && targetProblem === candidateProblem) score += 30;
  if(targetMachine && candidateMachine && targetMachine === candidateMachine) score += 10;

  return score;
}

function getOutcomeBucket(actions){
  const result = {
    ng: 0,
    improved: 0,
    ok: 0,
    confirmed: 0
  };

  for(const a of actions || []){
    if(a.result === "Không đạt") result.ng++;
    else if(a.result === "Cải thiện") result.improved++;
    else if(a.result === "Đạt") result.ok++;

    if(a.effective === true) result.confirmed++;
  }

  return result;
}

function buildKnowledgeSummary(target, targetActions, similarRows){
  const allRows = [target, ...similarRows];
  const uniqueMap = new Map();
  for(const c of allRows) uniqueMap.set(c.case_id, c);

  let totalActions = 0;
  let ng = 0;
  let improved = 0;
  let ok = 0;
  let confirmed = 0;
  const confirmedMethods = new Map();

  for(const c of uniqueMap.values()){
    const actions = c.__actions || [];
    totalActions += actions.length;

    for(const a of actions){
      if(a.result === "Không đạt") ng++;
      else if(a.result === "Cải thiện") improved++;
      else if(a.result === "Đạt") ok++;

      if(a.effective === true){
        confirmed++;
        const key = normalize(a.treatment);
        if(key){
          const item = confirmedMethods.get(key) || {name:a.treatment, count:0, batches:[]};
          item.count++;
          if(a.confirm_batch_no) item.batches.push(a.confirm_batch_no);
          confirmedMethods.set(key, item);
        }
      }
    }
  }

  const confirmedList = [...confirmedMethods.values()]
    .sort((a,b)=>b.count-a.count);

  let guidance = "Chưa có phương pháp nào được xác nhận hiệu quả trong nhóm Case đang xét.";
  if(confirmedList.length){
    guidance = "Có phương pháp đã được xác nhận hiệu quả trong lịch sử. Đây là bằng chứng tham khảo, không phải kết luận nguyên nhân gốc.";
  }

  return {
    caseCount: uniqueMap.size,
    actionCount: totalActions,
    ng,
    improved,
    ok,
    confirmed,
    confirmedList,
    guidance
  };
}

function renderKnowledgeSummary(summary){
  const confirmed = summary.confirmedList.length
    ? summary.confirmedList.map(x => `
        <div class="similar-card">
          <b>${esc(x.name)}</b>
          <br>
          <span class="hint">Đã xác nhận ${x.count} lần${x.batches.length ? " · Batch: " + esc([...new Set(x.batches)].join(", ")) : ""}</span>
        </div>
      `).join("")
    : '<p class="hint">Chưa có phương pháp xác nhận hiệu quả.</p>';

  return `
    <div class="knowledge-panel">
      <div class="knowledge-title">📚 Knowledge Summary V2.4</div>
      <div class="kpi-row">
        <span class="kpi">Cases: ${summary.caseCount}</span>
        <span class="kpi">Actions: ${summary.actionCount}</span>
        <span class="kpi badge-ng">NG: ${summary.ng}</span>
        <span class="kpi badge-imp">Cải thiện: ${summary.improved}</span>
        <span class="kpi badge-ok">Đạt: ${summary.ok}</span>
        <span class="kpi">⭐ Confirmed: ${summary.confirmed}</span>
      </div>
      <p>${esc(summary.guidance)}</p>
      <h4>⭐ Phương pháp đã được xác nhận</h4>
      ${confirmed}
    </div>
  `;
}

function renderSimilarCases(target, candidates){
  if(!candidates.length) return "";

  const cards = candidates.slice(0,8).map(item => {
    const c = item.caseData;
    const actions = c.__actions || [];
    const bucket = getOutcomeBucket(actions);
    const status = c.status || "OPEN";

    return `
      <div class="similar-card">
        <div class="similar-grid">
          <div>
            <b>${esc(c.case_id)} — ${esc(c.product_code)}</b>
            <br>
            <span class="tag">Batch: ${esc(c.batch_no)}</span>
            <span class="tag">${esc(c.problem)}</span>
            <p>${esc(c.description || "")}</p>
            <div class="kpi-row">
              <span class="kpi">NG ${bucket.ng}</span>
              <span class="kpi">Cải thiện ${bucket.improved}</span>
              <span class="kpi">Đạt ${bucket.ok}</span>
              <span class="kpi">⭐ Confirmed ${bucket.confirmed}</span>
            </div>
          </div>
          <div>
            <span class="kpi score">Match ${item.score}%</span>
            <br><br>
            <button onclick="openCase('${esc(c.case_id)}')">🔧 Xem Case</button>
          </div>
        </div>
      </div>
    `;
  }).join("");

  return `
    <div class="knowledge-panel">
      <div class="knowledge-title">🔎 Similar Case</div>
      <p class="hint">Điểm tương đồng dựa trên Product, Problem và Machine. Chỉ là mức độ tương đồng, không phải kết luận nguyên nhân.</p>
      ${cards}
    </div>
  `;
}

async function runAISearch(selectedCaseId=null){
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
        <b>DYEING AI FREE hiểu câu hỏi:</b><br>
        <span class="chip strong">Intent: ${esc(intent.label)}</span>
        <span class="chip ${scope.scopeType==="UNKNOWN"?"warn":"strong"}">Scope: ${esc(scope.label)}</span>
        ${scope.product?`<span class="chip">Product: ${esc(scope.product)}</span>`:""}
        ${scope.problem?`<span class="chip">Problem: ${esc(scope.problem)}</span>`:""}
        ${scope.batch?`<span class="chip">Batch: ${esc(scope.batch)}</span>`:""}
      </div>`;

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
          <p>DYEING AI FREE không tự mở rộng sang sản phẩm hoặc Batch khác.</p>
        </div>`;
      return;
    }

   if(matches.length>1 && !scope.batch && !selectedCaseId){
  result.innerHTML=`
    <div class="ai-answer">
      <div class="ai-title">📋 Có ${matches.length} Case phù hợp</div>
      <p>Chưa có Batch cụ thể. Hãy chọn Case bạn muốn phân tích.</p>
      ${matches.map(x=>`
        <article class="case">
          <h3>${esc(x.case_id)} — ${esc(x.product_code)}</h3>
          <span class="tag">Batch: ${esc(x.batch_no)}</span>
          <span class="tag">${esc(x.problem)}</span>
          <p>${esc(x.description)}</p>
          <button onclick="runAISearch('${esc(x.case_id)}')">🤖 Phân tích Case này</button>
        </article>`).join("")}
    </div>`;
  return;
}

const selected = selectedCaseId
  ? matches.find(x => x.case_id === selectedCaseId)
  : matches[0];

if(!selected){
  result.innerHTML=`
    <div class="ai-answer">
      <div class="ai-title">⚠️ Không tìm thấy Case đã chọn</div>
    </div>`;
  return;
}
    const actions=await getActions(selected.case_id);

    // V2.4: build a small evidence set of similar Cases
    // from the already retrieved database records.
    const scored = allCases
      .filter(c => c.case_id !== selected.case_id)
      .map(c => ({
        caseData: c,
        score: scoreSimilarCase(selected, c)
      }))
      .filter(x => x.score >= 60)
      .sort((a,b) => b.score - a.score)
      .slice(0, 8);

    const similarCases = scored.map(x => x.caseData);
    const actionMap = await getAllActionsForCases([selected, ...similarCases]);

    selected.__actions = actions;
    similarCases.forEach(c => {
      c.__actions = actionMap[c.case_id] || [];
    });

    const summary = buildKnowledgeSummary(
      selected,
      actions,
      similarCases
    );

    const similarHtml = renderSimilarCases(
      selected,
      scored
    );

    let nextActionText="";
    if(intent.type==="NEXT_ACTION"){
      const confirmed=actions.filter(a=>a.effective===true);
      if(confirmed.length){
        nextActionText=`<div class="interpretation"><b>⭐ Phương pháp đã được xác nhận:</b><br>${confirmed.map(a=>esc(a.treatment)).join("<br>")}</div>`;
      }else{
        nextActionText=`<div class="interpretation"><b>⚠️ Chưa có phương pháp được xác nhận hiệu quả.</b><br>Dữ liệu hiện tại chưa đủ để đưa ra khuyến nghị chắc chắn. Kỹ thuật viên có thể tiếp tục kiểm chứng theo quy trình thực tế.</div>`;
      }
    }

    const knowledgeBox = document.getElementById("knowledgeSummary");
    if(knowledgeBox){
      knowledgeBox.innerHTML = renderKnowledgeSummary(summary);
    }

    result.innerHTML=`
      <div class="ai-answer">
        <div class="ai-title">🤖 DYEING AI FREE V2.4</div>

        <p><b>Case:</b> ${esc(selected.case_id)} — ${esc(selected.product_code)}</p>

        <p>
          <span class="metric">Batch: ${esc(selected.batch_no)}</span>
          <span class="metric">Problem: ${esc(selected.problem)}</span>
          <span class="metric">Status: ${esc(selected.status || "OPEN")}</span>
        </p>

        <hr>

        <h4>📚 Lịch sử xử lý</h4>

        ${actions.length ? actions.map(a => `
          <div class="case">
            <b>Lần ${esc(a.action_no)}</b> — ${esc(a.treatment)}
            <br>
            Kết quả:
            ${a.result === "Không đạt" ? "❌" : a.result === "Cải thiện" ? "🟡" : a.result === "Đạt" ? "🟢" : "⚪"}
            ${esc(a.result)}
            ${a.effective ? `<br><span class="ok">⭐ Đã xác nhận hiệu quả</span>` : ""}
          </div>
        `).join("") : "<p>Chưa có Action được ghi nhận.</p>"}

        <h4>⭐ Phương pháp đã xác nhận hiệu quả</h4>

        ${summary.confirmedList.length
          ? summary.confirmedList.map(x => `<div class="case"><b>${esc(x.name)}</b><br><span class="hint">Xác nhận ${x.count} lần${x.batches.length ? " · Batch: " + esc([...new Set(x.batches)].join(", ")) : ""}</span></div>`).join("")
          : "<p>Chưa có phương pháp nào được xác nhận hiệu quả.</p>"
        }

        ${nextActionText}

        <p class="hint">
          V2.4 FREE: Similar Case + Knowledge Summary được tính trực tiếp từ dữ liệu Supabase.
          Không dùng OpenAI API, không dùng Edge Function.
        </p>

        <button onclick="openCase('${esc(selected.case_id)}')">🔧 Mở Case đầy đủ</button>
      </div>

      ${similarHtml}
    `;

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

if(product && problem){
  return {
    scopeType:"PRODUCT_PROBLEM",
    label:`${product} + ${problem}`,
    product,
    problem
  };
}

if(product){
  return {
    scopeType:"PRODUCT",
    label:`Product ${product}`,
    product
  };
}

if(batch){
  return {
    scopeType:"BATCH",
    label:`Batch ${batch}`,
    batch
  };
}

if(problem){
  return {
    scopeType:"PROBLEM",
    label:`Problem ${problem}`,
    problem
  };
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
async function loadDashboard(){
  const summary = document.getElementById("dashboardSummary");
  const filtersBox = document.getElementById("dashboardFilters");
  const casesBox = document.getElementById("dashboardCases");
  const actionsBox = document.getElementById("dashboardActions");

  summary.innerHTML = "Đang tải Dashboard...";
  casesBox.innerHTML = "";
  actionsBox.innerHTML = "";

  try{
    const cases = isSupabase
      ? await supa("dyeing_cases?select=*&order=created_at.desc")
      : localGet();

    let actions = [];

    if(isSupabase){
      actions = await supa("case_actions?select=*&order=created_at.desc");
    }else{
      for(const item of cases){
        const key = "dyeing_ai_actions_v2_" + item.case_id;
        try{
          const rows = JSON.parse(localStorage.getItem(key) || "[]");
          actions.push(...rows);
        }catch{}
      }
    }
function normalizeMachineLabel(value){
  const raw = (value || "").trim();

  if(!raw){
    return "Chưa xác định";
  }

  const compact = raw
    .toUpperCase()
    .replace(/\s+/g, "");

  const match = compact.match(/^([A-Z]+)(\d+)$/);

  if(match){
    return `${match[1]} ${match[2]}`;
  }

  return raw;
}
const productOptions = [...new Set(
  cases
    .map(x => (x.product_code || "").trim())
    .filter(Boolean)
)].sort();
const machineOptions = [...new Set(
  cases
    .map(x => normalizeMachineLabel(x.machine))
    .filter(Boolean)
)].sort();
  const selectedProduct =
  document.getElementById("dashboardProductFilter")?.value || "";
  const selectedMachine =
  document.getElementById("dashboardMachineFilter")?.value || "";

filtersBox.innerHTML = `
  <div class="dashboard-filter-bar">
    <label>
      Product
      <select id="dashboardProductFilter">
        <option value="">Tất cả Product</option>
        ${productOptions.map(value => `
          <option value="${esc(value)}">${esc(value)}</option>
        `).join("")}
      </select>
    </label>

    <label>
      Machine
      <select id="dashboardMachineFilter">
        <option value="">Tất cả Machine</option>
        ${machineOptions.map(value => `
          <option value="${esc(value)}">${esc(value)}</option>
        `).join("")}
      </select>
    </label>
  </div>
`;
const productFilter = document.getElementById("dashboardProductFilter");

productFilter.value = selectedProduct;

productFilter.onchange = () => {
  loadDashboard();
};
const machineFilter = document.getElementById("dashboardMachineFilter");

machineFilter.value = selectedMachine;

machineFilter.onchange = () => {
  loadDashboard();
};
const filteredCases = cases.filter(x => {
  const matchProduct =
    !selectedProduct ||
    (x.product_code || "").trim() === selectedProduct;

  const matchMachine =
    !selectedMachine ||
    normalizeMachineLabel(x.machine) === selectedMachine;

  return matchProduct && matchMachine;
});

const filteredCaseIds = new Set(
  filteredCases.map(x => x.case_id)
);

const filteredActions = actions.filter(
  x => filteredCaseIds.has(x.case_id)
);
const totalCases = filteredCases.length;
const confirmedCaseIds = new Set(
  filteredActions
    .filter(x => x.effective === true)
    .map(x => x.case_id)
    .filter(Boolean)
);
filteredCases
  .filter(x => x.status === "CONFIRMED")
  .forEach(x => confirmedCaseIds.add(x.case_id));

const confirmedCases = confirmedCaseIds.size;
    const openCases = filteredCases.filter(
  x => !confirmedCaseIds.has(x.case_id)
).length;
    const totalActions = filteredActions.length;
    const effectiveActions = filteredActions.filter(x => x.effective === true).length;
    const ngActions = filteredActions.filter(x => x.result === "Không đạt").length;
    const improvedActions = filteredActions.filter(x => x.result === "Cải thiện").length;
    const passedActions = filteredActions.filter(x => x.result === "Đạt").length;
    const productCounts = {};
    const problemCounts = {};
    const machineCounts = {};

function normalizeMachineLabel(value){
  const raw = (value || "").trim();

  if(!raw){
    return "Chưa xác định";
  }

  const compact = raw
    .toUpperCase()
    .replace(/\s+/g, "");

  const match = compact.match(/^([A-Z]+)(\d+)$/);

  if(match){
    return `${match[1]} ${match[2]}`;
  }

  return raw;
}

filteredCases.forEach(x => {
  const product = (x.product_code || "Chưa xác định").trim();
  const problem = (x.problem || "Chưa xác định").trim();
  const machine = normalizeMachineLabel(x.machine);

  productCounts[product] = (productCounts[product] || 0) + 1;
  problemCounts[problem] = (problemCounts[problem] || 0) + 1;
  machineCounts[machine] = (machineCounts[machine] || 0) + 1;
});
  const topProducts = Object.entries(productCounts)
  .sort((a,b) => b[1] - a[1]);
  const topProblems = Object.entries(problemCounts)
  .sort((a,b) => b[1] - a[1]);

const topMachines = Object.entries(machineCounts)
  .sort((a,b) => b[1] - a[1]);

casesBox.innerHTML = `
  <div class="dashboard-section">
    <h3>📋 Phân tích Case</h3>

    <div class="dashboard-analytics-grid">
<div class="dashboard-list">
  <h4>🧵 Product</h4>
  ${
    topProducts.length
      ? topProducts.map(([name,count]) => `
          <div class="dashboard-list-row">
            <span>${esc(name)}</span>
            <b>${count}</b>
          </div>
        `).join("")
      : `<p class="hint">Chưa có dữ liệu.</p>`
  }
</div>
      <div class="dashboard-list">
        <h4>⚠️ Problem</h4>
        ${
          topProblems.length
            ? topProblems.map(([name,count]) => `
                <div class="dashboard-list-row">
                  <span>${esc(name)}</span>
                  <b>${count}</b>
                </div>
              `).join("")
            : `<p class="hint">Chưa có dữ liệu.</p>`
        }
      </div>

      <div class="dashboard-list">
        <h4>🏭 Machine</h4>
        ${
          topMachines.length
            ? topMachines.map(([name,count]) => `
                <div class="dashboard-list-row">
                  <span>${esc(name)}</span>
                  <b>${count}</b>
                </div>
              `).join("")
            : `<p class="hint">Chưa có dữ liệu.</p>`
        }
      </div>
    </div>
  </div>
`;
actionsBox.innerHTML = `
  <div class="dashboard-section">
    <h3>🔧 Kết quả xử lý</h3>

    <div class="dashboard-grid">
      <div class="dashboard-stat">
        <b>❌ Không đạt</b>
        <strong>${ngActions}</strong>
      </div>

      <div class="dashboard-stat">
        <b>🟡 Cải thiện</b>
        <strong>${improvedActions}</strong>
      </div>

      <div class="dashboard-stat">
        <b>🟢 Đạt</b>
        <strong>${passedActions}</strong>
      </div>

      <div class="dashboard-stat">
        <b>⭐ Effective</b>
        <strong>${effectiveActions}</strong>
      </div>
    </div>
  </div>
`;
    const confirmedRate = totalCases
      ? Math.round((confirmedCases / totalCases) * 100)
      : 0;

    summary.innerHTML = `
      <div class="dashboard-grid">
        <div class="dashboard-stat">
          <b>Tổng Case</b>
          <strong>${totalCases}</strong>
        </div>

        <div class="dashboard-stat">
          <b>OPEN</b>
          <strong>${openCases}</strong>
        </div>

        <div class="dashboard-stat">
          <b>CONFIRMED</b>
          <strong>${confirmedCases}</strong>
        </div>

        <div class="dashboard-stat">
          <b>Tổng Action</b>
          <strong>${totalActions}</strong>
        </div>

        <div class="dashboard-stat">
          <b>Effective</b>
          <strong>${effectiveActions}</strong>
        </div>

        <div class="dashboard-stat">
          <b>Tỷ lệ Confirmed</b>
          <strong>${confirmedRate}%</strong>
        </div>
      </div>
    `;
  }catch(error){
    console.error(error);
    summary.innerHTML = `<div class="error">${esc(error.message)}</div>`;
  }
}
