// class progressBar {
//     private type: any;
//     private id: any;
//     private start: any;
//     private end: any;
//     private showDays: any;
//     constructor(type, id, label, start, end, showDays, color = "primary") {
//         this.type = type;
//         this.id = id;
//         this.start = start;
//         this.end = end;
//         this.showDays = showDays;
//         this.barArgs = [type, id, label, start, end, showDays, color];
//
//         // Create the html elements for the progress bar
//         this.outerDiv = document.createElement("div");
//
//         document.getElementById("progressBars").appendChild(this.outerDiv);
//
//         this.headingObject = document.createElement("h1");
//         this.headingObject.innerHTML = `<b id="${id}Label">0</b>% done with ${label} (<b id="${id}Left"></b> left)`;
//         this.headingObject.style.textAlign = "center";
//         this.outerDiv.appendChild(this.headingObject);
//         this.headingPercentObject = document.getElementById(id + "Label");
//         this.headingLeftObject = document.getElementById(id + "Left");
//
//         this.progressDiv = document.createElement("div");
//         this.progressDiv.classList.add("progress")
//         this.outerDiv.appendChild(this.progressDiv);
//         this.progressObject = document.createElement("div")
//         this.progressObject.classList.add(`progress-bar`, `progress-bar-striped`, `progress-bar-animated`, `bg-${color}`);
//         this.progressObject.style.width = "100%";
//         this.progressObject.role = "progressbar";
//         this.progressDiv.appendChild(this.progressObject)
//
//         // this.delEntry = document.createElement("option");
//         // this.delEntry.value = id;
//         // this.delEntry.innerText = id;
//         // document.getElementById("deleteCBars").appendChild(this.delEntry);
//
//         this.outerDiv.appendChild(createElementFromHTML(`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
//                  class="bi bi-x-lg deleteButton"
//                  viewBox="0 0 16 16"
//                  onclick="deleteCBar('${id}')">
//                 <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/>
//                 </svg>`));
//         this.outerDiv.appendChild(createElementFromHTML(`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-square editButton" viewBox="0 0 16 16" onclick="editCBar('${id}')">
//         <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
//         <path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z"/>
//                                                                   </svg>`));
//
//         if (type === "periods") {
//             for (let i = 0; i < this.start.length; i++) {
//                 this.start[i] = timeToMoment(this.start[i]);
//                 this.end[i] = timeToMoment(this.end[i]);
//             }
//         }
//     }
//
//     updateHTML() {
//         let percentDone;
//         let periodI;
//         switch (this.type) {
//             case "static":
//                 percentDone = getPercentDone(this.start, this.end);
//                 break
//             case "Not Implemented":
//                 percentDone = getPercentDone(this.start, this.end);
//                 break
//             case "daily":
//                 percentDone = getPercentDone(timeToMoment(this.start.format("LT")), timeToMoment(this.end.format("LT")));
//                 this.end = timeToMoment(this.end.format("LT"));
//                 break
//             case "periods":
//                 // Decide which period the current time is in and get the percent done from start and end arrays of times
//                 for (let i = 0; i < this.start.length; i++) {
//                     if (currentMoment.isBetween(this.start[i], this.end[i])) {
//                         percentDone = getPercentDone(this.start[i], this.end[i]);
//                         periodI = i;
//                         break
//                     } else if (currentMoment.isAfter(this.end[i])) {
//                         percentDone = 100;
//                         periodI = i;
//                     } else if (currentMoment.isBefore(this.start[i])) {
//                         percentDone = 0;
//                         periodI = i;
//                     }
//
//                 }
//                 if (!percentDone) {
//                     percentDone = -1;
//                 }
//                 break
//         }
//
//         let rStart = this.start
//         if (this.type === "periods") {
//             rStart = this.start[periodI];
//         }
//         let rEnd = this.end
//         if (this.type === "periods") {
//             rEnd = this.end[periodI];
//         }
//
//         this.progressObject.style.width = percentDone + "%";
//         this.headingPercentObject.innerText = percentDone.slice(0, (9 + digitModifier));
//         if (this.showDays) {
//             this.headingLeftObject.innerText = moment.duration(rEnd.diff(currentMoment)).format("dd [days,] " + timeLeftFormat, {trim: false}).replace("000,", "");
//         } else {
//             this.headingLeftObject.innerText = moment.duration(rEnd.diff(currentMoment)).format(timeLeftFormat, {trim: false}).replace("000,", "");
//         }
//     }
//
//     unRender() {
//         this.outerDiv.remove();
//         // this.headingObject.parentNode.removeChild(this.headingObject);
//         // this.delEntry.parentNode.removeChild(this.delEntry);
//     }
//
//     isId(id) {
//         return this.id === id;
//     }
//
// }
// Test Push