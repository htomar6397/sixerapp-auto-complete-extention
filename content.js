const batchID = 70464;

async function doselect(authToken, cookieName, sendResponse) {
  try {
    const response = await fetch(
      "https://sixerapp.com//student/courseworks/348/student_show_v2.json",
      {
        headers: {
          accept: "/",
          "accept-language": "en-US,en;q=0.9,hi;q=0.8",
          "auth-token": authToken,
          priority: "u=1, i",
          "s-web": "true",
          "sec-ch-ua":
            '"Google Chrome";v="129", "Not=A?Brand";v="8", "Chromium";v="129"',
          "sec-ch-ua-mobile": "?1",
          "sec-ch-ua-platform": '"Android"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-origin",
          "x-api": "true",
          "x-context": "{}",
          cookie: cookieName,
          Referer:
            "https://sixerapp.com/student/batches/"+batchID+"/cw_modules/1657/cw_activity/6311",
          "Referrer-Policy": "strict-origin-when-cross-origin",
        },
        body: null,
        method: "GET",
      }
    );

    const data = await response.json();
    let exam_attempts = [];
    const coursework_modules = data.coursework_modules;
    const fetchPromises = [];
    let totalRequests = 0;
    let completedRequests = 0;

    for (const key in coursework_modules) {
      if (coursework_modules.hasOwnProperty(key)) {
        const module = coursework_modules[key];

        module.for_show.activities.forEach((activity) => {
          const { id, doc_type } = activity;

          if (!(activity.progress && activity.progress.status === "done")) {
            if (doc_type === "practice_test") {
              totalRequests++; // Increment total requests for tracking

              const fetchPromise = fetch(
                `https://sixerapp.com/lms/exam_sessions/by_activity.json?id=${id}`,
                {
                  headers: {
                    accept: "/",
                    "accept-language": "en-US,en;q=0.9,hi;q=0.8",
                    "auth-token": authToken,
                    priority: "u=1, i",
                    "s-web": "true",
                    "sec-ch-ua":
                      '"Google Chrome";v="129", "Not=A?Brand";v="8", "Chromium";v="129"',
                    "sec-ch-ua-mobile": "?1",
                    "sec-ch-ua-platform": '"Android"',
                    "sec-fetch-dest": "empty",
                    "sec-fetch-mode": "cors",
                    "sec-fetch-site": "same-origin",
                    "x-api": "true",
                    "x-context": "{}",
                    cookie: cookieName,
                    Referer: `https://sixerapp.com/student/batches/${batchID}/start_quiz/${id}`,
                    "Referrer-Policy": "strict-origin-when-cross-origin",
                  },
                  method: "GET",
                }
              )
                .then((response) => response.json())
                .then((response) => {
                  if (response.attempt_id !== null) {
                    exam_attempts.push(id);
                  }
                  completedRequests++; // Increment completed requests

                  // Send progress update
                  chrome.runtime.sendMessage({
                    action: "updateProgress",
                    progress: (completedRequests / totalRequests) * 100,
                  });
                })
                .catch((error) =>
                  console.log(
                    `Failed to fetch quiz for activity ${id}: ${error}`
                  )
                );

              fetchPromises.push(fetchPromise);
            }
          }
        });
      }
    }

    // Handle case where no requests were made
    if (totalRequests === 0) {
      // Set a minimum progress percentage to avoid staying at 0%
      chrome.runtime.sendMessage({
        action: "updateProgress",
        progress: 50, // Set to a mid-point if no requests
      });
    }

    // Send a periodic progress update until all requests complete
    const progressInterval = setInterval(() => {
      const progress =
        totalRequests === 0 ? 100 : (completedRequests / totalRequests) * 100;
      chrome.runtime.sendMessage({
        action: "updateProgress",
        progress: progress,
      });

      // If all requests are completed, stop sending updates
      if (completedRequests === totalRequests) {
        clearInterval(progressInterval);
      }
    }, 500); // Send progress updates every 1 second

    // Wait for all fetch requests to complete
    await Promise.all(fetchPromises);

    // Send the final response back once all fetch operations are done
    sendResponse({
      exam_attempts: exam_attempts,
      obj: data,
      authToken: authToken,
      cookieName: cookieName,
    });
  } catch (error) {
    console.error("Error during data fetching:", error);
    sendResponse({ error: error.message });
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fetchdata") {
    const profileData = localStorage.getItem("profileData");
    const authToken = profileData ? JSON.parse(profileData).auth_token : null;

    // Send a message to the background to get the cookie
    chrome.runtime.sendMessage({ action: "getCookie" }, (response) => {
      if (response && response.cookie) {
        const cookieName = response.cookie;
        doselect(authToken, cookieName, sendResponse);
      } else {
        sendResponse({
          authToken: authToken || "No token found",
          cookieName: "No cookie found",
        });
      }
    });

    // Required to return true to indicate that you want to send an async response
    return true;
  }
});
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "runApiCall") {
    const profileData = localStorage.getItem("profileData");
    const authToken = profileData ? JSON.parse(profileData).auth_token : null;

    chrome.runtime.sendMessage({ action: "getCookie" }, (response) => {
      if (response && response.cookie) {
        const cookieName = response.cookie;

        // Run the API calls inside fetchAll
        fetchAll(request.selectedModules, authToken, cookieName, sendResponse);
      } else {
        sendResponse({
          authToken: null,
          cookieName: "No cookie found",
        });
      }
    });

    return true;
  }
});

async function fetchAll(selectedModules, authToken, cookieName, sendResponse) {
  try {
 

    const mainResponse = await fetch(
      "https://sixerapp.com//student/courseworks/348/student_show_v2.json",
      {
        headers: {
          accept: "/",
          "accept-language": "en-US,en;q=0.9,hi;q=0.8",
          "auth-token": authToken,
          priority: "u=1, i",
          "s-web": "true",
          "sec-ch-ua":
            '"Google Chrome";v="129", "Not=A?Brand";v="8", "Chromium";v="129"',
          "sec-ch-ua-mobile": "?1",
          "sec-ch-ua-platform": '"Android"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-origin",
          "x-api": "true",
          "x-context": "{}",
          cookie: cookieName,
          Referer:
            "https://sixerapp.com/student/batches/"+batchID+"/cw_modules/1657/cw_activity/6311",
          "Referrer-Policy": "strict-origin-when-cross-origin",
        },
        body: null,
        method: "GET",
      }
    );
    const courseworkData = await mainResponse.json();

    const coursework_modules = courseworkData.coursework_modules;
    const fetchPromises = [];
    let totalActivities = 0;
    let failedApiCalls = 0; // Counter for failed API calls

    for (const key in coursework_modules) {
      if (
        coursework_modules.hasOwnProperty(key) 
        &&
        selectedModules.includes(Number(key))
      ) {
        const module = coursework_modules[key];
        totalActivities += module.for_show.activities.length;

        module.for_show.activities.forEach((activity) => {
          if (activity.doc_type === "practice_test") {            fetchPromises.push(
              fetchPracticeTest(activity.id, authToken, cookieName).catch(
                () => {
                  failedApiCalls++;
                }
              )
            );
          } else {
            fetchPromises.push(
              updateActivityProgress(activity.id, authToken, cookieName).catch(
                () => {
                  failedApiCalls++;
                }
              )
            );
          }
        });
      }
    }

    // Loader update: Initial message before starting
  

    let completedActivities = 0;

    // Track each API call and update progress percentage
    await Promise.all(
      fetchPromises.map(async (promise) => {
        const result = await promise;
        completedActivities += 1;
        const progress = Math.round(
          (completedActivities / totalActivities) * 100
        );

        chrome.runtime.sendMessage({
          action: "updateProgress2",
          progress: progress,
        });

        return result;
      })
    );


    // Final response after all API calls
    sendResponse({
      status: "success",
      message: "All activities processed.",
      progress: 100,
      failedCalls: failedApiCalls,
    });
  } catch (error) {
    sendResponse({
      status: "error",
      message: "Unexpected error occurred",
      error: error.toString(),
      progress: 0,
    });
  }
}

async function fetchPracticeTest(id, authToken, cookieName) {

  const response = await fetch(
    `https://sixerapp.com/lms/exam_sessions/by_activity.json?id=${id}`,
    {
      headers: {
        accept: "/",
        "accept-language": "en-US,en;q=0.9,hi;q=0.8",
        "auth-token": authToken,
        priority: "u=1, i",
        "s-web": "true",
        "sec-ch-ua":
          '"Google Chrome";v="129", "Not=A?Brand";v="8", "Chromium";v="129"',
        "sec-ch-ua-mobile": "?1",
        "sec-ch-ua-platform": '"Android"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "x-api": "true",
        "x-context": "{}",
        cookie: cookieName,
        Referer: `https://sixerapp.com/student/batches/${batchID}/start_quiz/${id}`,
        "Referrer-Policy": "strict-origin-when-cross-origin",
      },
      body: null,
      method: "GET",
    }
  );
  
  
  const data = await response.json();

  const answers = [];
  
  
 const body = JSON.stringify({
   started_at: new Date().toISOString(),
   exam_session_student_id: data.data.students[0].id,
   exam_session_id: data.data.id,
   answers: answers,
   submitted_at: new Date().toISOString(),
   ended_at: new Date().toISOString(),
   activity: {
     extras: {
       qp_id: data.data.qp_dump.qp.base_id,
       allow_retakes: "Yes",
       no_time_limit: null,
       pass_percentage: "0",
     },
     id: id,
     title: data.data.title,
     doc_type: "practice_test",
   },
   extras: {},
 });
  
  const postResponse = await 

                  fetch(
                    `https://sixerapp.com/lms/exam_sessions/${data.data.id}/exam_attempts.json`,
                    {
                      headers: {
                        accept: "/",
                        "accept-language": "en-US,en;q=0.9,hi;q=0.8",
                        "auth-token": authToken,
                        "content-type": "application/json;charset=UTF-8",
                        priority: "u=1, i",
                        "s-web": "true",
                        "sec-ch-ua":
                          '"Google Chrome";v="129", "Not=A?Brand";v="8", "Chromium";v="129"',
                        "sec-ch-ua-mobile": "?1",
                        "sec-ch-ua-platform": '"Android"',
                        "sec-fetch-dest": "empty",
                        "sec-fetch-mode": "cors",
                        "sec-fetch-site": "same-origin",
                        "x-api": "true",
                        "x-context": "{}",
                        cookie: cookieName,
                        Referer:
                          "https://sixerapp.com/student/batches/"+batchID+"/examination/",
                        "Referrer-Policy": "strict-origin-when-cross-origin",
                      },
                      body: body,
                      method: "POST",
                    }
                  );
                  console.log("postResponse" , postResponse);
                  
  return await postResponse.json();
}

async function updateActivityProgress(id, authToken, cookieName) {
 
  const response = await fetch(
    "https://sixerapp.com/student/batches/"+batchID+"/create_or_update_student_activity_progress.json",
    {
      headers: {
        accept: "/",
        "accept-language": "en-US,en;q=0.9,hi;q=0.8",
        "auth-token": authToken,
        "content-type": "application/json;charset=UTF-8",
        priority: "u=1, i",
        "s-web": "true",
        "sec-ch-ua":
          '"Google Chrome";v="129", "Not=A?Brand";v="8", "Chromium";v="129"',
        "sec-ch-ua-mobile": "?1",
        "sec-ch-ua-platform": '"Android"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "x-api": "true",
        "x-context": "{}",
        cookie: cookieName,
        Referer: `https://sixerapp.com/student/batches/${batchID}/cw_modules/1648/cw_activity/${id}`,
        "Referrer-Policy": "strict-origin-when-cross-origin",
      },
      body: `{\"id\":${batchID},\"activity_id\":${id},\"status\":\"done\"}`,
      method: "POST",
    }
  );
  return await response.json();
}

// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   if (request.action === "runApiCall") {
//     // Assuming you are extracting the auth token and performing the API call in content.js
//     const profileData = localStorage.getItem("profileData");
//     const authToken = profileData ? JSON.parse(profileData).auth_token : null;

//     // Send a message to the background to get the cookie
//     chrome.runtime.sendMessage({ action: "getCookie" }, (response) => {
//       if (response && response.cookie) {
//         const cookieName = response.cookie;

//         doapi(request.selectedModules,authToken, cookieName, sendResponse);
//       } else {
//         sendResponse({
//           authToken: authToken || "No token found",
//           cookieName: "No cookie found",
//         });
//       }
//     });

//     // Required to return true to indicate that you want to send an async response
//     return true;
//   }
// });

// async function doapi(selectedModules,authToken, cookieName,sendResponse) {
//   fetch("https://sixerapp.com//student/courseworks/348/student_show_v2.json", {
//     headers: {
//       accept: "/",
//       "accept-language": "en-US,en;q=0.9,hi;q=0.8",
//       "auth-token": authToken,
//       priority: "u=1, i",
//       "s-web": "true",
//       "sec-ch-ua":
//         '"Google Chrome";v="129", "Not=A?Brand";v="8", "Chromium";v="129"',
//       "sec-ch-ua-mobile": "?1",
//       "sec-ch-ua-platform": '"Android"',
//       "sec-fetch-dest": "empty",
//       "sec-fetch-mode": "cors",
//       "sec-fetch-site": "same-origin",
//       "x-api": "true",
//       "x-context": "{}",
//       cookie: cookieName,
//       Referer:
//         "https://sixerapp.com/student/batches/68778/cw_modules/1657/cw_activity/6311",
//       "Referrer-Policy": "strict-origin-when-cross-origin",
//     },
//     body: null,
//     method: "GET",
//   })
//     .then((response) => response.json())
//     .then((response) => {
//         console.log(selectedModules, "selected modules");
        
//       const coursework_modules = response.coursework_modules;
//       for (const key in coursework_modules) {
//         console.log(key, selectedModules.indexOf(Number(key))!=-1);
        
//         if (
//           coursework_modules.hasOwnProperty(key) &&
//           selectedModules.indexOf(Number(key)) != -1
//         ) {
//           const module = coursework_modules[key];

//           console.log(module.title);

//           module.for_show.activities.forEach((activity) => {
//             const { id, doc_type } = activity;

//             if (doc_type === "practice_test") {
//               fetch(
//                 `https://sixerapp.com/lms/exam_sessions/by_activity.json?id=${id}`,
//                 {
//                   headers: {
//                     accept: "/",
//                     "accept-language": "en-US,en;q=0.9,hi;q=0.8",
//                     "auth-token": authToken,
//                     priority: "u=1, i",
//                     "s-web": "true",
//                     "sec-ch-ua":
//                       '"Google Chrome";v="129", "Not=A?Brand";v="8", "Chromium";v="129"',
//                     "sec-ch-ua-mobile": "?1",
//                     "sec-ch-ua-platform": '"Android"',
//                     "sec-fetch-dest": "empty",
//                     "sec-fetch-mode": "cors",
//                     "sec-fetch-site": "same-origin",
//                     "x-api": "true",
//                     "x-context": "{}",
//                     cookie: cookieName,
//                     Referer: `https://sixerapp.com/student/batches/68778/start_quiz/${id}`,
//                     "Referrer-Policy": "strict-origin-when-cross-origin",
//                   },
//                   body: null,
//                   method: "GET",
//                 }
//               )
//                 .then((response) => response.json())
//                 .then((data) => {
//                   const answers =
//                     data.data.qp_dump.qp.sections[0].questions.map(
//                       (question) => ({
//                         question_id: question.id,
//                         qp_section_id: data.data.qp_dump.qp.sections[0].id,
//                         ans: {},
//                       })
//                     );
//                   const body = JSON.stringify({
//                     started_at: new Date().toISOString(),
//                     exam_session_student_id: data.data.students[0].id,
//                     exam_session_id: data.data.id,
//                     answers: answers,
//                     submitted_at: new Date().toISOString(),
//                     ended_at: new Date().toISOString(),
//                     activity: {
//                       extras: {
//                         qp_id: data.data.qp_dump.qp.base_id,
//                         allow_retakes: "Yes",
//                         no_time_limit: null,
//                         pass_percentage: "0",
//                       },
//                       id: id,
//                       title: data.data.title,
//                       doc_type: "practice_test",
//                     },
//                     extras: {},
//                   });

//                   fetch(
//                     `https://sixerapp.com/lms/exam_sessions/${data.data.id}/exam_attempts.json`,
//                     {
//                       headers: {
//                         accept: "/",
//                         "accept-language": "en-US,en;q=0.9,hi;q=0.8",
//                         "auth-token": authToken,
//                         "content-type": "application/json;charset=UTF-8",
//                         priority: "u=1, i",
//                         "s-web": "true",
//                         "sec-ch-ua":
//                           '"Google Chrome";v="129", "Not=A?Brand";v="8", "Chromium";v="129"',
//                         "sec-ch-ua-mobile": "?1",
//                         "sec-ch-ua-platform": '"Android"',
//                         "sec-fetch-dest": "empty",
//                         "sec-fetch-mode": "cors",
//                         "sec-fetch-site": "same-origin",
//                         "x-api": "true",
//                         "x-context": "{}",
//                         cookie: cookieName,
//                         Referer:
//                           "https://sixerapp.com/student/batches/68778/examination/",
//                         "Referrer-Policy": "strict-origin-when-cross-origin",
//                       },
//                       body: body,
//                       method: "POST",
//                     }
//                   )
//                     .then((response) => response.json())
//                     .then((dataa) =>
//                       console.log("practice_test-> " + JSON.stringify(dataa))
//                     )
//                     .catch((error) =>
//                       console.error(
//                         "practice_test->Error in examattempt:",
//                         error
//                       )
//                     );
//                 })
//                 .catch((error) =>
//                   console.error("practice_test->Error in fetching:", error)
//                 );
//             } else {
//               fetch(
//                 "https://sixerapp.com/student/batches/68778/create_or_update_student_activity_progress.json",
//                 {
//                   headers: {
//                     accept: "/",
//                     "accept-language": "en-US,en;q=0.9,hi;q=0.8",
//                     "auth-token": authToken,
//                     "content-type": "application/json;charset=UTF-8",
//                     priority: "u=1, i",
//                     "s-web": "true",
//                     "sec-ch-ua":
//                       '"Google Chrome";v="129", "Not=A?Brand";v="8", "Chromium";v="129"',
//                     "sec-ch-ua-mobile": "?1",
//                     "sec-ch-ua-platform": '"Android"',
//                     "sec-fetch-dest": "empty",
//                     "sec-fetch-mode": "cors",
//                     "sec-fetch-site": "same-origin",
//                     "x-api": "true",
//                     "x-context": "{}",
//                     cookie: cookieName,
//                     Referer: `https://sixerapp.com/student/batches/68778/cw_modules/1648/cw_activity/${id}`,
//                     "Referrer-Policy": "strict-origin-when-cross-origin",
//                   },
//                   body: `{\"id\":68778,\"activity_id\":${id},\"status\":\"done\"}`,
//                   method: "POST",
//                 }
//               )
//                 .then((response) => response.json())
//                 .then((data) => console.log(doc_type + "-> " + data.status))
//                 .catch((error) => console.error(doc_type + "-> Error:", error));
//             }
//           });
//         }
//       }
//     })
//     .catch((error) => console.log(error));
// }

