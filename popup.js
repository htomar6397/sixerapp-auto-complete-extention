let response;
let exam_attempts;
let intervalId;
let interval_id;



// function updateProgressUI(progress) {
//   console.log(progress);

//   let circularProgress = document.querySelector(".circular-progress"),
//     progressValue = document.querySelector(".progress-value");

//   let targetProgress = progress.toFixed();

//   progressValue.textContent = `${targetProgress}%`;
//   circularProgress.style.background = `conic-gradient(#7d2ae8 ${
//     targetProgress * 3.6
//   }deg, #ededed 0deg)`;
// }
function updateProgressUI(progress) {
  console.log(progress);

  let circularProgress = document.querySelector(".circular-progress"),
    progressValue = document.querySelector(".progress-value");
console.log(typeof progressValue.textContent);

  let currentProgress = parseFloat(progressValue.textContent)|| 0;
console.log(currentProgress);

  if (progress < currentProgress) {
    return; // Do nothing if the new progress is less than or equal to the current progress
  }
  if(intervalId) clearInterval(intervalId); // Clear any existing interval
  progressValue.textContent = `${progress.toFixed()}%`;
  circularProgress.style.background = `conic-gradient(#7d2ae8 ${
    progress * 3.6
  }deg, #ededed 0deg)`;
 currentProgress=progress;
 if(currentProgress!=100)
 { intervalId = setInterval(() => {
   
      let increment = (100 - currentProgress) / 100; // Calculate increment based on current progress
      currentProgress += increment;
      if (currentProgress < 98) {
      
         
        
      
      progressValue.textContent = `${currentProgress.toFixed()}%`;
      circularProgress.style.background = `conic-gradient(#7d2ae8 ${
        currentProgress * 3.6
      }deg, #ededed 0deg)`;
    }
    
  }, 100); }// Adjust interval timing for speed
}




  

document.getElementById("homeButtonto").addEventListener("click", () => {
    if(document.getElementById("homeButton").innerText == "GO TO") chrome.tabs.create({ url: 'https://sixerapp.com/student' });

      if(document.getElementById("homeButton").innerText=="RELOAD"){
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    let tab = tabs[0];

  
        // Reload the active tab
        chrome.tabs.reload(tab.id);
      

      })
         window.close();
    }


      if (document.getElementById("homeButtonto").style.cursor == "progress")
        return;
        document.getElementById("homeButtonto").classList.add("loading");

  // Reset progress UI
  updateProgressUI(0);

  // Send a message to the content script to run the API call logic
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length > 0) {
 let tab = tabs[0];
    let url = new URL(tab.url);
    if (url.href.startsWith("https://sixerapp.com/student")) {
        console.log('OK');
      
    } else {
    
        document.getElementById("error").innerHTML =
          'Please visit <a href="https://sixerapp.com/student" target="_blank">https://sixerapp.com/student</a>';
    updateProgressUI(100);
        console.log("Not a SixerApp.com tab");
        document.getElementById("homeButton").innerText = "GO TO";
        document.getElementById("homeButtonto").classList.remove("loading");
        return;
  
    }
      chrome.tabs.sendMessage(
        tabs[0].id,
        { action: "fetchdata" },
        (respons) => {
          if (respons) {
            if(respons.authToken==null) {
                document.getElementById("error").innerHTML =
                  "Please login to Continue";
                  updateProgressUI(100);
                console.log("No auth token found");
                document.getElementById("homeButton").innerText = "LOGIN";
               document.getElementById("homeButtonto").classList.remove("loading");
              return;
            }
             document.getElementsByClassName("home")[0].style.display = "none";
             document.getElementsByClassName("cparent")[0].style.display =
               "block";
            // Display the results returned from the content script
            document.getElementById(
              "authTokenDisplay"
            ).textContent = `Auth Token: ${respons.authToken}`;
            document.getElementById(
              "cookieDisplay"
            ).textContent = `Cookie: ${respons.cookieName}`;

            response = respons.obj;
            exam_attempts = respons.exam_attempts;
            console.log(response, exam_attempts);

            // Render HTML based on the response
            displayDays();
          } else {
            updateProgressUI(100);
              document.getElementById("error").innerHTML =
                "Click on Reload";
                document.getElementById("homeButton").innerText="RELOAD";
                        document
                          .getElementById("homeButtonto")
                          .classList.remove("loading");
            console.log("Failed to run API call");
          }
        }
      );
    } else {
      updateProgressUI(100);
      document.getElementById("error").innerHTML =  "Please manually Reload your TAB and reopen extension"
      console.log("No active tabs found");
       document.getElementById("homeButton").innerText = "RELOAD";
        document.getElementById("homeButtonto").classList.remove("loading");
    }
  });
});

// Listen for progress updates from content.js
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "updateProgress") {
    updateProgressUI(message.progress);
  }
});

let selectedModules = {};

const isModuleCompleted = (moduleId) => {
  const module = response.coursework_modules[moduleId];
  return module.for_show.activities.every(
    (activity) =>
      exam_attempts.includes(activity.id) ||
      (activity.progress && activity.progress.status === "done")
  );
};

const isDayCompleted = (day) => {
  return day.module_ids.every((moduleId) => isModuleCompleted(moduleId));
};

const getCompletedModulesCount = (day) => {
  return day.module_ids.filter((moduleId) => isModuleCompleted(moduleId))
    .length;
};

const displayDays = () => {
  const daysGrid = document.getElementById("daysGrid");
  daysGrid.innerHTML = "";

  response.tabs.forEach((day, index) => {
    const dayDiv = document.createElement("div");
    dayDiv.className = "day-item";

    const selectedCount = selectedModules[day.display]?.length || 0;
    const isCompleted = isDayCompleted(day);
    const completedCount = getCompletedModulesCount(day);
    const totalModules = day.module_ids.length;

    dayDiv.innerHTML = `
                    <h3>${day.display}</h3>
                    <div class="status-info">
                        <span class="${
                          isCompleted ? "completed" : "in-progress"
                        }">
                            ${isCompleted ? "Completed" : "In Progress"}
                        </span>
                        <span>Selected: ${selectedCount}</span>
                    </div>
                    <div class="status-info">
                        <span>Total: ${totalModules}</span>
                        <span>Completed: ${completedCount}</span>
                    </div>
                `;

    dayDiv.onclick = () => displayModules(day);
    daysGrid.appendChild(dayDiv);
  });

  updateSelectAllCheckbox();
};

const displayModules = (day) => {
  document.getElementById("daysGrid").style.display = "none";
  document.getElementById("moduleList").style.display = "block";

  const moduleContainer = document.getElementById("modulesContainer");
  moduleContainer.innerHTML = `<h2>${day.display}</h2>`;

  // Add "Select All" checkbox for the day
  const selectAllDay = document.createElement("div");
  selectAllDay.className = "checkbox-container";
  const uncompletedModules = day.module_ids.filter(
    (moduleId) => !isModuleCompleted(moduleId)
  );
  const allUncompleted =
    selectedModules[day.display]?.length === uncompletedModules.length;
  selectAllDay.innerHTML = `
                <input type="checkbox" id="selectAllDay" ${
                  allUncompleted ? "checked" : ""
                }>
                <label for="selectAllDay">Select All Uncompleted Modules</label>
            `;
  moduleContainer.appendChild(selectAllDay);

  selectAllDay.querySelector("input").onchange = (e) => {
    const isChecked = e.target.checked;
    selectedModules[day.display] = isChecked ? uncompletedModules : [];
    displayModules(day); // Refresh the module list
  };

  day.module_ids.forEach((moduleId) => {
    const module = response.coursework_modules[moduleId];
    const isCompleted = isModuleCompleted(moduleId);

    const moduleDiv = document.createElement("div");
    moduleDiv.className = "module-item";

    const isSelected = selectedModules[day.display]?.includes(moduleId);

    moduleDiv.innerHTML = `
                    <div class="checkbox-container">
                        <input type="checkbox" id="module-${moduleId}" class="module-check" 
                               data-module-id="${moduleId}" ${
      isSelected ? "checked" : ""
    } ${isCompleted ? "disabled" : ""}>
                        <label for="module-${moduleId}">
                            ${module.title} ${
      isCompleted ? '<span class="completed">(Completed)</span>' : ""
    }
                        </label>
                    </div>
                `;

    const activitiesList = document.createElement("ul");
    module.for_show.activities.forEach((activity) => {
      const activityItem = document.createElement("li");
      activityItem.innerHTML = `${activity.title} - <span class="${
        exam_attempts.includes(activity.id) ||
        (activity.progress && activity.progress.status === "done")
          ? "completed"
          : "in-progress"
      }">${
        exam_attempts.includes(activity.id) ||
        (activity.progress && activity.progress.status === "done")
          ? "Completed"
          : "Not Started"
      }</span>`;
      activitiesList.appendChild(activityItem);
    });
    moduleDiv.appendChild(activitiesList);

    moduleContainer.appendChild(moduleDiv);
  });

  document.querySelectorAll(".module-check").forEach((checkbox) => {
    checkbox.onchange = () => {
      const moduleId = parseInt(checkbox.dataset.moduleId);
      if (checkbox.checked) {
        selectedModules[day.display] = selectedModules[day.display] || [];
        if (!selectedModules[day.display].includes(moduleId)) {
          selectedModules[day.display].push(moduleId);
        }
      } else {
        selectedModules[day.display] = selectedModules[day.display].filter(
          (id) => id !== moduleId
        );
      }
      // Update "Select All" checkbox
      const uncompletedModules = day.module_ids.filter(
        (moduleId) => !isModuleCompleted(moduleId)
      );
      document.getElementById("selectAllDay").checked =
        selectedModules[day.display]?.length === uncompletedModules.length;
      updateSelectAllCheckbox();
    };
  });
};

document.getElementById("backButton").onclick = () => {
  document.getElementById("moduleList").style.display = "none";
  document.getElementById("daysGrid").style.display = "flex";
  displayDays();
};

const updateSelectAllCheckbox = () => {
  const selectAllCheckbox = document.getElementById("selectAll");
  const allUncompletedModules = response.tabs.flatMap((day) =>
    day.module_ids.filter((moduleId) => !isModuleCompleted(moduleId))
  );
  const allSelectedUncompletedModules = Object.values(selectedModules).flat();
  selectAllCheckbox.checked =
    allSelectedUncompletedModules.length === allUncompletedModules.length;
};

document.getElementById("selectAll").onchange = (e) => {
  const isChecked = e.target.checked;
  response.tabs.forEach((day) => {
    const uncompletedModules = day.module_ids.filter(
      (moduleId) => !isModuleCompleted(moduleId)
    );
    selectedModules[day.display] = isChecked ? uncompletedModules : [];
  });
  displayDays();
};

document.getElementById("startButton").addEventListener("click", () => {
     const selectedModuleIds = Object.values(selectedModules).flat();
     if(selectedModuleIds.length ===0) {document.getElementById('mes').style.color="red"; return;}
    document.getElementsByClassName('main')[0].style.display = 'none';
    document.getElementsByClassName("loader")[0].style.display = "flex";
  // Send a message to the content script to run the API call logic
 
  //    alert("Starting selected modules: " + selectedModuleIds.join(", "));
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length > 0) {
      chrome.tabs.sendMessage(
        tabs[0].id,
        { action: "runApiCall", selectedModules: selectedModuleIds },
        (respons) => {
            if (respons) {
console.log(respons);

if(respons.status==="success") {
if (respons.failedCalls)
document.getElementById("erroor").innerHTML = respons.failedCalls + " failed </br> Try Again Later" ;
else document.getElementById("mess").innerHTML = respons.message;
document.getElementById("blue").style.display = "block";
}
                
            } else {
                  document.getElementById("erroor").innerHTML =
                    "Click on Reload";
                  document.getElementById("homeButton").innerText = "RELOAD";
                  document
                    .getElementById("homeButtonto")
                    .classList.remove("loading");
                  console.log("Failed to run API call");
            }
        }
      );
    } else {
           document.getElementById("erroor").innerHTML =
             "Please manually Reload your TAB and reopen extension";
           console.log("No active tabs found");
           document.getElementById("homeButton").innerText = "RELOAD";
           document.getElementById("homeButtonto").classList.remove("loading");

          }
  });
});
function updateProgressUI2(progress) {
  console.log(progress);

  let circularProgress = document.getElementById("homeButtontom"),
    progressValue = document.getElementById("homeButtono");

  let targetProgress = progress;

  progressValue.textContent = `${targetProgress}%`;
  circularProgress.style.background = `conic-gradient(#7d2ae8 ${
    targetProgress * 3.6
  }deg, #ededed 0deg)`;
}
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "updateProgress2") {
    updateProgressUI2(message.progress);
  }
});
document.getElementById("blue").addEventListener("click",()=>{
   window.location.reload();
});
