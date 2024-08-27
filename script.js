const taskList = []; //Array para almacenar las tareas(notas).
let originalText = ""; //Variable para guardar el texto original para cuando se edita la tarea.

//Función para generar un ID único para cada tarea.
function generateTaskId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

//Función para crear las tareas.
function createTask() {
  //Variables para guardar el título, descripción y la dificultad elegida.
  const title = document.getElementById("taskTitle").value.trim(); //No tomo en cuenta los espacios.
  const description = document.getElementById("taskDescription").value.trim(); //No tomo en cuenta los espacios.
  const difficulty = document.getElementById("taskDifficulty").value;

  //Obligo a que las tareas tengan títulos.
  if (!title) {
    alert("El título es obligatorio.");
    return;
  }

  //'Plantilla' de las tareas.
  const task = [
    generateTaskId(),
    title, //Título
    description || "", //Descripción en caso de venir nulo queda vacío.
    null, //Fecha límite.
    difficulty, //Dificultad.
    new Date(), //Fecha de creación.
    "Pendiente", //Estado inicial de la tarea.
    null, //Fecha de última edición.
    null, //Referencia al temporizador.
    null, //Elemento HTML para mostrar el tiempo restante para completar la tarea.
  ];

  taskList.push(task); //Agrego mi tarea al array de tareas.
  addTaskToDOM(task); //Muestro en pantalla la tarea.
  saveTasksToLocalStorage(); //Guardo las tareas en localStorage(en el navegador).
  alert("Tarea creada con éxito."); /*Cambiar por modal*/
  hideTaskForm(); //Oculto el formulario de creación de tarea.
  document.getElementById("taskTitle").value = ""; //Restablesco los valores de los formularios.
  document.getElementById("taskDescription").value = "";
}

//Para ingresar el tiempo que va a tener la tarea.
function showTimerDialog(task) {
  if (task[6] === "Terminada" || task[6] === "Cancelada") {
    //Si la tarea está marcada como "Terminada" o "Cancelada" no te va a dejar poner un temporizador.
    alert(
      "No puedes iniciar un temporizador para una tarea que ya está terminada o cancelada." /*Cambiar por un modal*/,
    );
    return;
  }

  const time = prompt(
    "Ingresa el tiempo límite en minutos:",
  ); /*Cambiar por un modal*/
  if (time && !isNaN(time) && time > 0) {
    //Solo se puede ingresar valores válidos
    const endTime = new Date(new Date().getTime() + time * 60000); //Cálculo el tiempo en minutos.
    task[3] = endTime; //Le asigno a mi tarea el valor del temporizador.

    //Si ya tiene un temporizador la tarea, se cancela.
    if (task[8]) clearInterval(task[8]);

    startTimer(task); //Se inicio el temporizador
    saveTasksToLocalStorage(); //Se guarda en el navegador el tiempo de la tarea.
  }
}

//Función del temporizador
function startTimer(task) {
  task[8] = setInterval(function () {
    const remainingTime = Math.max(0, task[3].getTime() - new Date().getTime()); //Cálculo el tiempo restante.
    updateTaskTimer(task, remainingTime); //Muestro el tiempo restante.

    if (remainingTime <= 0) {
      //Si termina la tarea, reseteo valores e indico al usuario.
      clearInterval(task[8]); //Quitamos el intervalo.
      task[8] = null; //Seteamos en null el temporizador
      task[6] = "Cancelada"; //Se asigna el valor de la tarea 'cancelada'
      moveTaskToSection(task); //Movemos la tarea a la zona 'cancelada'
      saveTasksToLocalStorage(); //Guardamos localmente que la tarea se cancelo.
      alert(
        'El tiempo para la tarea "' +
          task[1] +
          '" ha expirado. La tarea ha sido cancelada.',
      );
    }
  }, 1000); //Se va a actualizar el intervalo cada segundo la función.
}

//Actualizo el temporizador en la nota('interfaz').
function updateTaskTimer(task, remainingTime) {
  let minutes = Math.floor(remainingTime / 60000);
  let seconds = Math.floor((remainingTime % 60000) / 1000);

  if (task[9]) {
    //Mientras le quede tiempo al temporizador lo va a mostrar en el DOM.
    task[9].textContent =
      remainingTime > 0
        ? "Tiempo restante: " +
          minutes +
          ":" +
          (seconds < 10 ? "0" : "") +
          seconds
        : "";
  }
}

//Cambia la dificultad de una tarea (entre ⭐,⭐⭐ y ⭐⭐⭐).
function changeDifficulty(taskId) {
  //Busco la tarea mediante el ID en la lista de tareas.
  let task = null;
  for (let i = 0; i < taskList.length; i++) {
    if (taskList[i][0] === taskId) {
      task = taskList[i];
      break;
    }
  }
  if (!task) return; //Sino la me salgo de la función

  let difficulties = ["⭐", "⭐⭐", "⭐⭐⭐"];
  let currentIndex = difficulties.indexOf(task[4]); //Encuentro el índice actual del nivel de dificultad de la tarea.
  let nextIndex = (currentIndex + 1) % difficulties.length; //Vuelvo el array circular

  task[4] = difficulties[nextIndex]; //Actualizo el nivel de dificultad por su siguiente.

  const starButton = document.getElementById("star-button-" + taskId);
  if (starButton) {
    //Actualizo visualmente el cambio en el DOM.
    starButton.textContent = task[4];
  }
}

//Función para mover una tarea a otra sección
function moveTaskToSection(task) {
  //Se cancela el temporizador si la tarea se mueve a "Terminada" o "Cancelada"
  if (task[6] === "Terminada" || task[6] === "Cancelada") {
    if (task[8]) {
      clearInterval(task[8]);
      task[8] = null; //Se limpia el temporizador.
      task[3] = null; //Se limpia la fecha límite.
    }
    if (task[9]) {
      task[9].textContent = ""; //Se limpia la visualización del temporizador en pantalla.
    }
  } else {
    //Si la tarea se mueve desde "Cancelada" a otra condición.
    if (task[6] !== "Cancelada") {
      task[3] = null; //Se resetea la fecha límite.
      task[8] = null; //Se resetea el temporizador.
    }
  }

  const taskElement = document.getElementById(`task-${task[0]}`); //Busco el ID de la tarea
  if (taskElement) {
    taskElement.className = `task-card ${getStatusClass(task[6])}`; //Se actualiza la clase para cambiar el estado segun su condición.
    taskElement.remove(); //Eliminamos el elemento de su posición actual.
    addTaskToDOM(task); //Se muestra el elemento en la la nueva sección.
  }
  saveTasksToLocalStorage(); //Se guarda los cambios localmente.
}

//Función para eliminar una tarea.
function deleteTask(taskElement, taskId) {
  if (confirm("¿Estás seguro de que deseas eliminar esta tarea?")) {
    /*Cambiar por modal*/
    taskElement.remove();
    for (let i = 0; i < taskList.length; i++) {
      if (taskList[i][0] === taskId) {
        taskList.splice(i, 1); //Eliminamos la tarea de nuestro array de tareas.
        break;
      }
    }
    saveTasksToLocalStorage(); //Se guarda los cambios localmente.
  }
}

//Función para mostrar visualmente la tarea.
function addTaskToDOM(task) {
  const taskElement = document.createElement("div"); //Cada tarea es un 'div'.
  taskElement.className = `task-card ${getStatusClass(task[6])}`; //Adquiere el color asignado a 'pendiente' por medio de la clase.
  taskElement.id = `task-${task[0]}`; //Se le asigna un id único.
  taskElement.draggable = true; //Se le da la propiedad para poder arrastrar el 'div'.
  taskElement.ondragstart = drag; //Se le asigna el evento para arrastrar el 'div'.

  const taskTitle = document.createElement("h3"); //Buscamos el título.
  taskTitle.textContent = task[1]; //Le asignmos como valor lo que el usuario indicó.
  taskElement.appendChild(taskTitle); //Lo mostramos.

  //Proceso similar al caso del 'título'.
  const taskDescription = document.createElement("p");
  taskDescription.id = "description-card";
  taskDescription.textContent = task[2];
  taskElement.appendChild(taskDescription);

  //Muestra la fecha de creación o  de edición.
  const taskInfo = document.createElement("p");
  taskInfo.className = "timer";
  taskInfo.id = `task-info-${task[0]}`;
  taskInfo.textContent = task[7]
    ? `Editado: ${task[7].toLocaleString()}`
    : `Creado: ${task[5].toLocaleString()}`;
  taskElement.appendChild(taskInfo);

  //Muestra el temporizador
  const timerDisplay = document.createElement("p");
  task[9] = timerDisplay;
  taskElement.appendChild(timerDisplay);

  //Muestra el botón encargado de iniciar el proceso de poner tiempo a una tarea.
  const timerButton = document.createElement("button");
  timerButton.className = "timer-button";
  timerButton.textContent = "⏰";
  timerButton.onclick = () => showTimerDialog(task);
  taskElement.appendChild(timerButton);

  //Es un botón que muestra la dificultad de la tarea con la funcionalidad de poder modificar la tarea.
  const taskStar = document.createElement("button");
  taskStar.className = "star-button";
  taskStar.id = `star-button-${task[0]}`;
  taskStar.textContent = task[4];
  taskStar.onclick = () => changeDifficulty(task[0]);
  taskElement.appendChild(taskStar);

  //Boton para eliminar la tarea.
  const deleteButton = document.createElement("button");
  deleteButton.className = "delete-button";
  deleteButton.textContent = "🗑️";
  deleteButton.onclick = () => deleteTask(taskElement, task[0]);
  taskElement.appendChild(deleteButton);

  //Cuando se hace doble click se entra en la edición de la tarea.
  taskElement.ondblclick = () => editTask(taskElement, task);

  //Finalmente muestro la tarea.
  document.getElementById(getSectionId(task[6])).appendChild(taskElement);
}

//Dependiendo el estado de la clase le corresponderá una clase usada para mostrar el color de la tarea.
function getStatusClass(status) {
  const statusClassMap = {
    Pendiente: "pending",
    "En Curso": "in-progress",
    Terminada: "completed",
    Cancelada: "cancelled",
  };
  return statusClassMap[status] || "";
}

//Se obtiene el ID del 'div' de tareas según el estado.
function getSectionId(status) {
  const sectionIdMap = {
    Pendiente: "pendingTasks",
    "En Curso": "inProgressTasks",
    Terminada: "completedTasks",
    Cancelada: "cancelledTasks",
  };
  return sectionIdMap[status];
}

//Cuando se edita la tarea
function editTask(taskElement, task) {
  //Variables para manejar el título y la descripción.
  originalText = taskElement.querySelector("h3").textContent.trim();
  const titleElement = taskElement.querySelector("h3");
  const descriptionElement = taskElement.querySelector("#description-card");

  //Propiedad para poder editar la tarea.
  titleElement.contentEditable = true;
  descriptionElement.contentEditable = true;

  //Función para colocar el cursor al final del título.
  function placeCursorAtEnd(element) {
    let range = document.createRange();
    let selection = window.getSelection();
    range.selectNodeContents(element);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
    element.focus();
  }

  placeCursorAtEnd(titleElement);

  //Cuando termino la edición necesito actualizar los nuevos valores de la nota.
  function saveChanges() {
    if (
      titleElement.textContent.trim() !== originalText ||
      descriptionElement.textContent.trim() !== task[2]
    ) {
      saveTaskEdit(taskElement, task); //Si se produce un cambio en el título o en la descripción.
    }
    //Quito las propiedades de edición.
    titleElement.contentEditable = false;
    descriptionElement.contentEditable = false;
    taskElement.removeEventListener("focusout", checkFocusLoss); //Quitamos el evento.
  }

  //Función para determinar si el usuario termino de editar(clickeo fuera de la nota que estaba editando).
  function checkFocusLoss(event) {
    if (!taskElement.contains(event.relatedTarget)) {
      saveChanges();
    }
  }

  taskElement.addEventListener("focusout", checkFocusLoss);

  //Se agrega el evento para cuando se entre a la edición, los cursores esten al final del text/palabra.
  descriptionElement.addEventListener("click", function () {
    placeCursorAtEnd(descriptionElement);
  });
}

/*function saveChanges(taskElement, task) {
  console.log("Intentando guardar cambios");
  const titleElement = taskElement.querySelector("h3");
  const descriptionElement = taskElement.querySelector("#description-card");
  if (
    titleElement.textContent.trim() !== originalText ||
    descriptionElement.textContent.trim() !== task[2]
  ) {
    saveTaskEdit(taskElement, task);
  }
  titleElement.contentEditable = false;
  descriptionElement.contentEditable = false;
  taskElement.onfocusout = null;
}

function checkFocusLoss(event) {
  console.log("Verificando pérdida de foco");
  if (!this.contains(event.relatedTarget)) {
    console.log("Foco perdido, guardando cambios");
    saveChanges(this, findTaskById(this.id));
  }
}

function handleTitleKeydown(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    saveChanges(
      this.closest(".task-card"),
      findTaskById(this.closest(".task-card").id),
    );
  }
}

function findTaskById(elementId) {
  const taskId = elementId.replace("task-", "");
  return taskList.find((task) => task[0] === taskId);
}*/

//Se actualizan los cambios de edición en la tarea.
function saveTaskEdit(taskElement, task) {
  const updatedTitle = taskElement.querySelector("h3").textContent.trim();
  const updatedDescription = taskElement.querySelector("p").textContent.trim();

  //El nuevo título no puede estar vacío.
  if (!updatedTitle) {
    alert("El título no puede estar vacío.");
    taskElement.querySelector("h3").textContent = originalText;
    return;
  }

  task[1] = updatedTitle;
  task[2] = updatedDescription;
  task[5] = new Date(); //Actualizo la fecha de creacion original por la editada para que se pueda ordenar por fecha.
  task[7] = new Date(); //Actualiza la fecha de edición

  //Mostrar el mensaje de 'Editado'.
  const taskInfoElement = taskElement.querySelector(`#task-info-${task[0]}`);
  if (taskInfoElement) {
    taskInfoElement.textContent = `Editado: ${task[7].toLocaleString()}`;
  }

  saveTasksToLocalStorage(); //Guardo en local
}

//Habilito el poder arrastrar de tareas en el HTML.
function allowDrop(event) {
  event.preventDefault();
}

//Captura el arrastre del usuario
function drag(event) {
  event.dataTransfer.setData("taskId", event.target.id);
}

//Captura el evento de soltar del usuario.
function drop(event, status) {
  event.preventDefault();
  const taskId = event.dataTransfer.getData("taskId");
  const taskElement = document.getElementById(taskId);

  //Buscamos la tarea en la lista de tareas.
  let task = null;
  for (let i = 0; i < taskList.length; i++) {
    if (`task-${taskList[i][0]}` === taskId) {
      task = taskList[i];
      break;
    }
  }

  //Si el estado de la tarea cambió(se movió de sección).
  if (task[6] !== status) {
    task[6] = status;
    //Si la tarea se mueve desde "Cancelada" a otra condición.
    if (task[6] !== "Cancelada") {
      task[3] = null; //Se resetea la fecha límite.
      task[8] = null; //Se resetea el temporizador.
    }
    moveTaskToSection(task);
  } else {
    //Permite reordenar las tareas que se encuentran en la misma sección.
    const dropTarget = event.target.closest(".task-card");
    if (dropTarget) {
      const container = document.getElementById(getSectionId(status));
      if (container) container.insertBefore(taskElement, dropTarget);
    }
  }
  saveTasksToLocalStorage(); // Guardar los cambios después de mover la tarea
}

//Buscamos las tareas por título o descripción.
function searchTasks() {
  let query = document.querySelector('input[type="text"]').value.toLowerCase();
  let taskElements = document.querySelectorAll(".task-card");
  //Recorro todas mis tareas.
  for (let i = 0; i < taskElements.length; i++) {
    let taskElement = taskElements[i];
    let title = taskElement.querySelector("h3").textContent.toLowerCase();
    let description = taskElement.querySelector("p").textContent.toLowerCase();
    //Si no coincide con lo que busco la desaparesco con CSS.
    taskElement.style.display =
      title.indexOf(query) !== -1 || description.indexOf(query) !== -1
        ? "block"
        : "none";
  }
}

//Cada vez que el usuario escribe en el buscador, se llama a la función 'searchTasks'.
document
  .querySelector('input[type="text"]')
  .addEventListener("input", function () {
    searchTasks();
  });

//Muestro el formulario de creación de tareas.
function showTaskForm() {
  const taskForm = document.getElementById("taskForm");
  if (taskForm) {
    taskForm.style.display = "flex";
    taskForm.style.flexDirection = "column";
  }
}

//Oculto el formulario de creación de tareas.
function hideTaskForm() {
  const taskForm = document.getElementById("taskForm");
  if (taskForm) {
    taskForm.style.display = "none";
  }
}

//Guardo las tareas localmente
function saveTasksToLocalStorage() {
  let tasksToSave = [];
  for (let i = 0; i < taskList.length; i++) {
    let taskCopy = taskList[i].slice(); //Copiamos todas las tareas.
    if (taskCopy[3] instanceof Date) {
      taskCopy[3] = taskCopy[3].toISOString(); //Se convierte la fecha a formato ISO(AAAA-MM-DDTHH:mm:ss.sss).
    }
    taskCopy[8] = null; //Referencia al temporizador.
    taskCopy[9] = null; //Elemento HTML para mostrar el tiempo restante para completar la tarea.
    tasksToSave.push(taskCopy); //Ingresamos las tareas en el array copia de tareas.
  }
  //Se guarda el array de tareas en formato JSON localmente.
  localStorage.setItem("taskList", JSON.stringify(tasksToSave));
}

//Cargo las tareas guardadas localmente.
function loadTasksFromLocalStorage() {
  let storedTasks = localStorage.getItem("taskList");
  if (storedTasks) {
    taskList.length = 0; //Reseteo las tareas.
    let parsedTasks = JSON.parse(storedTasks); //Pasan las tareas de JSON a array.
    for (let i = 0; i < parsedTasks.length; i++) {
      let task = parsedTasks[i];
      //Convierto las fechas de cadenas a objetos Date.
      task[3] = task[3] ? new Date(task[3]) : null; //Fecha de límite.
      task[5] = new Date(task[5]); //Fecha de creación.
      task[7] = task[7] ? new Date(task[7]) : null; //Fecha de edición.

      addTaskToDOM(task); //Mostramos las tareas.
      taskList.push(task); //Agregamos las tareas guardadas al array original.

      //Si la tarea tiene una fecha límite y no está terminada o cancelada se muestra el timer.
      if (task[3] && task[6] !== "Terminada" && task[6] !== "Cancelada") {
        //Calculo el tiempo restante.
        let remainingTime = Math.max(
          0,
          task[3].getTime() - new Date().getTime(),
        );

        if (remainingTime > 0) {
          // Inicia el temporizador si queda tiempo para terminarla.
          startTimer(task);
        } else {
          task[6] = "Cancelada"; //Sino se asigna como 'cancelada' se mueve a cancelada
          moveTaskToSection(task); //Y se mueve a la dicha sección.
        }
      }
    }
    saveTasksToLocalStorage(); //Guardo localmente.
  }
}

//Se ordenan las tareas según un criterio.
function sortTasks(criteria, order) {
  order = order || "asc"; //Por defecto es ascendente.
  taskList.sort(function (a, b) {
    let comparison = 0;
    if (criteria === "title") {
      //Comparo por título.
      comparison = a[1].localeCompare(b[1]);
    } else if (criteria === "dueDate") {
      //Comparo por fecha.
      comparison = (a[3] ? a[3].getTime() : 0) - (b[3] ? b[3].getTime() : 0);
    } else if (criteria === "creationDate") {
      //Comparo por fecha de creación.
      comparison = a[5].getTime() - b[5].getTime();
    } else if (criteria === "editDate") {
      //Comparo por fecha de edición.
      comparison = (a[7] ? a[7].getTime() : 0) - (b[7] ? b[7].getTime() : 0);
    }
    return order === "asc" ? comparison : -comparison; //Si se quiere que sea descendente se invierte el orden.
  });
  refreshDOM(); //Acutalizamos el DOM.
}
//Actualizamos el DOM después de ordenar.
function refreshDOM() {
  let sections = [
    "pendingTasks",
    "inProgressTasks",
    "completedTasks",
    "cancelledTasks",
  ];

  for (let i = 0; i < sections.length; i++) {
    let section = document.getElementById(sections[i]);
    section.innerHTML = ""; //Borro la vista de todas mis tareas.
  }

  for (let j = 0; j < taskList.length; j++) {
    addTaskToDOM(taskList[j]); //Agrego todas las tareas.
  }
}

//Cuando se recargue la página se recargan las tareas.
document.addEventListener("DOMContentLoaded", loadTasksFromLocalStorage);
