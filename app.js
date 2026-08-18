let allCases = [];
let currentCase = null;

const cfg = window.DYEING_CONFIG || {};
const isSupabase = !!(
  cfg.SUPABASE_URL &&
  cfg.SUPABASE_ANON_KEY
);

const DEMO_KEY = "dyeing_ai_cases_v1";


// ======================================================
// INITIAL SETUP
// ======================================================

document.getElementById("date").value =
  new Date().toISOString().slice(0, 10);

document.getElementById("mode").textContent =
  isSupabase
    ? "● Shared Database Mode"
    : "● Demo Browser Mode";


// ======================================================
// PAGE NAVIGATION
// ======================================================

document.querySelectorAll(".nav").forEach(button => {

  button.onclick = () => {

    showPage(button.dataset.page);

    if (button.dataset.page === "cases") {
      loadCases();
    }

  };

});


function showPage(pageId) {

  document
    .querySelectorAll(".nav")
    .forEach(x => x.classList.remove("active"));

  document
    .querySelectorAll(".page")
    .forEach(x => x.classList.remove("active"));

  const page = document.getElementById(pageId);

  if (page) {
    page.classList.add("active");
  }

  const navButton =
    document.querySelector(
      `.nav[data-page="${pageId}"]`
    );

  if (navButton) {
    navButton.classList.add("active");
  }

}


// ======================================================
// LOCAL DEMO STORAGE
// ======================================================

function localGet() {

  try {

    return JSON.parse(
      localStorage.getItem(DEMO_KEY) || "[]"
    );

  } catch {

    return [];

  }

}


function localSave(data) {

  localStorage.setItem(
    DEMO_KEY,
    JSON.stringify(data)
  );

}


// ======================================================
// SUPABASE API
// ======================================================

async function supa(path, options = {}) {

  const headers = {

    "apikey": cfg.SUPABASE_ANON_KEY,

    "Content-Type":
      "application/json",

    "Prefer":
      "return=representation",

    ...(options.headers || {})

  };


  const response = await fetch(

    cfg.SUPABASE_URL +
    "/rest/v1/" +
    path,

    {
      ...options,
      headers
    }

  );


  if (!response.ok) {

    const text =
      await response.text();

    throw new Error(
      `Supabase ${response.status}: ${text}`
    );

  }


  return response.status === 204
    ? []
    : await response.json();

}


// ======================================================
// CREATE CASE
// ======================================================

document.getElementById("caseForm").onsubmit =
  async function (event) {

    event.preventDefault();


    const id =
      "CASE-" + Date.now();


    const record = {

      case_id: id,

      product_code:
        document.getElementById("product")
          .value.trim(),

      batch_no:
        document.getElementById("batch")
          .value.trim(),

      machine:
        document.getElementById("machine")
          .value.trim(),

      event_date:
        document.getElementById("date")
          .value,

      problem:
        document.getElementById("problem")
          .value,

      description:
        document.getElementById("description")
          .value.trim(),

      status: "OPEN",

      treatment: null,

      result: null,

      effective: null,

      next_action: null,

      created_by: "Worker",

      created_at:
        new Date().toISOString()

    };


    const message =
      document.getElementById("saveMsg");


    try {

      if (isSupabase) {

        await supa(
          "dyeing_cases",
          {
            method: "POST",
            body: JSON.stringify(record)
          }
        );

      } else {

        const data = localGet();

        data.unshift(record);

        localSave(data);

      }


      message.className =
        "success";

      message.textContent =
        "✓ Đã lưu " + id;


      event.target.reset();


      document.getElementById("date").value =
        new Date()
          .toISOString()
          .slice(0, 10);


    } catch (error) {

      console.error(error);

      message.className =
        "error";

      message.textContent =
        "Không lưu được: " +
        error.message;

    }

  };


// ======================================================
// LOAD CASES
// ======================================================

async function loadCases() {

  const box =
    document.getElementById("caseList");

  box.innerHTML =
    "Đang tải...";


  try {

    if (isSupabase) {

      allCases =
        await supa(
          "dyeing_cases?select=*&order=created_at.desc"
        );

    } else {

      allCases =
        localGet();

    }


    render(
      allCases,
      box
    );


  } catch (error) {

    console.error(error);

    box.innerHTML =
      `<div class="error">
        ${esc(error.message)}
      </div>`;

  }

}


// ======================================================
// RENDER CASE LIST
// ======================================================

function render(rows, box) {

  if (!rows.length) {

    box.innerHTML =
      "<p>Chưa có Case.</p>";

    return;

  }


  box.innerHTML = rows.map(x => `

    <article class="case">

      <h3>
        ${esc(x.case_id)}
        —
        ${esc(x.product_code)}
      </h3>

      <span class="tag">
        Batch: ${esc(x.batch_no)}
      </span>

      <span class="tag">
        ${esc(x.machine)}
      </span>

      <span class="tag">
        ${esc(x.problem)}
      </span>

      <p>
        <b>Hiện tượng:</b>
        ${esc(x.description)}
      </p>

      <p>
        <b>Trạng thái:</b>

        <span class="status">
          ${esc(x.status || "OPEN")}
        </span>

      </p>


      <button
        onclick="openCase('${esc(x.case_id)}')">

        🔧 Xem / cập nhật xử lý

      </button>

    </article>

  `).join("");

}


// ======================================================
// OPEN CASE DETAIL
// ======================================================

async function openCase(caseId) {

  try {

    let found =
      allCases.find(
        x => x.case_id === caseId
      );


    if (!found) {

      if (isSupabase) {

        const result =
          await supa(
            `dyeing_cases?case_id=eq.${encodeURIComponent(caseId)}&select=*`
          );

        found = result[0];

      }

    }


    if (!found) {

      alert("Không tìm thấy Case.");

      return;

    }


    currentCase = found;


    showPage("caseDetail");


    document.getElementById(
      "detailCaseTitle"
    ).textContent =
      `${found.case_id} — ${found.product_code}`;


    document.getElementById(
      "caseInformation"
    ).innerHTML = `

      <div class="case">

        <p>
          <b>Product:</b>
          ${esc(found.product_code)}
        </p>

        <p>
          <b>Batch:</b>
          ${esc(found.batch_no)}
        </p>

        <p>
          <b>Machine:</b>
          ${esc(found.machine)}
        </p>

        <p>
          <b>Ngày:</b>
          ${esc(found.event_date)}
        </p>

        <p>
          <b>Vấn đề:</b>
          ${esc(found.problem)}
        </p>

        <p>
          <b>Hiện tượng:</b>
          ${esc(found.description)}
        </p>

        <p>
          <b>Trạng thái:</b>
          ${esc(found.status || "OPEN")}
        </p>

      </div>

    `;


    await loadActions(found.case_id);


  } catch (error) {

    console.error(error);

    alert(
      "Không mở được Case: " +
      error.message
    );

  }

}


// ======================================================
// LOAD ACTION HISTORY
// ======================================================

async function loadActions(caseId) {

  const box =
    document.getElementById("actionList");

  box.innerHTML =
    "Đang tải lịch sử xử lý...";


  try {

    let actions = [];


    if (isSupabase) {

      actions =
        await supa(
          `case_actions?case_id=eq.${encodeURIComponent(caseId)}&select=*&order=action_no.asc`
        );

    } else {

      const key =
        "dyeing_ai_actions_v2_" +
        caseId;

      try {

        actions =
          JSON.parse(
            localStorage.getItem(key) ||
            "[]"
          );

      } catch {

        actions = [];

      }

    }


    if (!actions.length) {

      box.innerHTML = `

        <p class="hint">
          Chưa có lần xử lý nào.
        </p>

      `;

      return;

    }


    box.innerHTML =
      actions.map(action => {

        let resultClass =
          "status";


        let resultIcon =
          "⚪";


        if (
          action.result === "Không đạt"
        ) {

          resultIcon = "❌";

        } else if (
          action.result === "Cải thiện"
        ) {

          resultIcon = "🟡";

        } else if (
          action.result === "Đạt"
        ) {

          resultIcon = "🟢";

        }


        const effectiveText =
          action.effective
            ? `<p>
                 <b>
                   ⭐ Phương pháp hiệu quả
                 </b>
               </p>`
            : "";


        const confirmText =
          action.confirm_batch_no
            ? `<p>
                 <b>Mẻ xác nhận:</b>
                 ${esc(action.confirm_batch_no)}
               </p>`
            : "";


        return `

          <article class="case">

            <h3>
              Lần xử lý ${esc(action.action_no)}
            </h3>

            <p>
              <b>Phương pháp:</b>
              ${esc(action.treatment)}
            </p>

            <p>
              <b>Kết quả:</b>

              <span class="${resultClass}">
                ${resultIcon}
                ${esc(action.result)}
              </span>

            </p>

            ${
              action.notes
                ? `
                  <p>
                    <b>Ghi chú:</b>
                    ${esc(action.notes)}
                  </p>
                `
                : ""
            }

            ${confirmText}

            ${effectiveText}

            <p class="hint">
              Người thực hiện:
              ${esc(action.created_by || "Worker")}
            </p>

          </article>

        `;

      }).join("");


  } catch (error) {

    console.error(error);

    box.innerHTML = `

      <div class="error">

        Không tải được lịch sử:
        ${esc(error.message)}

      </div>

    `;

  }

}


// ======================================================
// OPEN ACTION FORM
// ======================================================

function openActionForm() {

  if (!currentCase) {

    alert(
      "Vui lòng mở một Case trước."
    );

    return;

  }


  document.getElementById(
    "actionFormBox"
  ).style.display = "block";


  document.getElementById(
    "actionTreatment"
  ).focus();

}


// ======================================================
// CLOSE ACTION FORM
// ======================================================

function closeActionForm() {

  document.getElementById(
    "actionFormBox"
  ).style.display = "none";


  document.getElementById(
    "actionForm"
  ).reset();


  document.getElementById(
    "actionSaveMsg"
  ).textContent = "";

}


// ======================================================
// SAVE ACTION
// ======================================================

document.getElementById(
  "actionForm"
).onsubmit = async function (event) {

  event.preventDefault();


  if (!currentCase) {

    alert(
      "Không xác định được Case."
    );

    return;

  }


  const message =
    document.getElementById(
      "actionSaveMsg"
    );


  try {

    let existingActions = [];


    if (isSupabase) {

      existingActions =
        await supa(
          `case_actions?case_id=eq.${encodeURIComponent(currentCase.case_id)}&select=action_no&order=action_no.desc`
        );

    } else {

      const key =
        "dyeing_ai_actions_v2_" +
        currentCase.case_id;

      try {

        existingActions =
          JSON.parse(
            localStorage.getItem(key) ||
            "[]"
          );

      } catch {

        existingActions = [];

      }

    }


    let nextActionNo = 1;


    if (existingActions.length) {

      nextActionNo =
        Math.max(
          ...existingActions.map(
            x => Number(x.action_no) || 0
          )
        ) + 1;

    }


    const treatment =
      document.getElementById(
        "actionTreatment"
      ).value.trim();


    const result =
      document.getElementById(
        "actionResult"
      ).value;


    const notes =
      document.getElementById(
        "actionNotes"
      ).value.trim();


    const confirmBatch =
      document.getElementById(
        "confirmBatch"
      ).value.trim();


    const effective =
      document.getElementById(
        "actionEffective"
      ).checked;
if (effective && !confirmBatch) {
  message.className = "error";
  message.textContent =
    "⚠️ Vui lòng nhập Mẻ xác nhận trước khi xác nhận phương pháp hiệu quả.";
  return;
}

    const record = {

      case_id:
        currentCase.case_id,

      action_no:
        nextActionNo,

      treatment:
        treatment,

      result:
        result,

      notes:
        notes || null,

      effective:
        effective,

      confirm_batch_no:
        confirmBatch || null,

      created_by:
        "Worker",

      created_at:
        new Date().toISOString(),

      updated_at:
        new Date().toISOString()

    };


    if (isSupabase) {

      await supa(
        "case_actions",
        {
          method: "POST",
          body: JSON.stringify(record)
        }
      );


      /*
       * Nếu phương pháp được xác nhận hiệu quả,
       * cập nhật trạng thái Case.
       */

      if (effective) {

        await supa(

          `dyeing_cases?case_id=eq.${encodeURIComponent(currentCase.case_id)}`,

          {
            method: "PATCH",

            body: JSON.stringify({

              status:
                "CONFIRMED",

              treatment:
                treatment,

              result:
                result,

              effective:
                true,

              next_action:
                "Continue monitoring"

            })

          }

        );

      }

    } else {

      const key =
        "dyeing_ai_actions_v2_" +
        currentCase.case_id;


      let actions = [];


      try {

        actions =
          JSON.parse(
            localStorage.getItem(key) ||
            "[]"
          );

      } catch {

        actions = [];

      }


      actions.push(record);


      localStorage.setItem(
        key,
        JSON.stringify(actions)
      );

    }


    message.className =
      "success";

    message.textContent =
      `✓ Đã lưu lần xử lý ${nextActionNo}`;


    document.getElementById(
      "actionForm"
    ).reset();


    await loadActions(
      currentCase.case_id
    );


    if (effective) {

      /*
       * Cập nhật giao diện Case hiện tại
       */

      currentCase.status =
        "CONFIRMED";

      currentCase.treatment =
        treatment;

      currentCase.result =
        result;

      currentCase.effective =
        true;

    }


    setTimeout(() => {

      closeActionForm();

    }, 1200);


  } catch (error) {

    console.error(error);

    message.className =
      "error";

    message.textContent =
      "Không lưu được: " +
      error.message;

  }

};


// ======================================================
// SEARCH
// ======================================================

async function runSearch() {

  const query =
    document.getElementById(
      "searchBox"
    ).value
      .trim()
      .toLowerCase();


  try {

    if (!allCases.length) {

      if (isSupabase) {

        allCases =
          await supa(
            "dyeing_cases?select=*&order=created_at.desc"
          );

      } else {

        allCases =
          localGet();

      }

    }


    const rows =
      allCases.filter(x =>

        Object
          .values(x)
          .join(" ")
          .toLowerCase()
          .includes(query)

      );


    render(
      rows,
      document.getElementById(
        "searchResult"
      )
    );


  } catch (error) {

    document.getElementById(
      "searchResult"
    ).innerHTML = `

      <div class="error">

        ${esc(error.message)}

      </div>

    `;

  }

}


// ======================================================
// ESCAPE HTML
// ======================================================

function esc(value) {

  return String(
    value ?? ""
  ).replace(
    /[&<>"']/g,
    character => ({

      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"

    }[character])

  );

}


// ======================================================
// START
// ======================================================

loadCases();