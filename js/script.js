document.addEventListener('DOMContentLoaded', () => {

  /* ============================
     Bloque de Equipos
     ============================ */
  try {
    if (document.getElementById('btnAgregarJugador')) {
      // Recuperamos o inicializamos jugadores y equipos
      let jugadores = localStorage.getItem('jugadores')
        ? JSON.parse(localStorage.getItem('jugadores'))
        : [];
      let equipos = localStorage.getItem('equipos')
        ? JSON.parse(localStorage.getItem('equipos'))
        : [];

      // Referencias en el DOM
      const btnAgregarJugador = document.getElementById('btnAgregarJugador');
      const nombreJugadorInput = document.getElementById('nombreJugador');
      const claseJugadorSelect = document.getElementById('claseJugador');
      const listaJugadores = document.getElementById('listaJugadores');

      const btnAgregarEquipo = document.getElementById('btnAgregarEquipo');
      const nombreEquipoInput = document.getElementById('nombreEquipo');
      const listaEquipos = document.getElementById('listaEquipos');

      // Función para renderizar la lista de jugadores sin asignar
      function renderJugadores() {
        listaJugadores.innerHTML = '';
        jugadores.forEach((jugador, index) => {
          const li = document.createElement('li');
          li.textContent = `${jugador.nombre} (${jugador.clase})`;
          li.draggable = true;
          li.dataset.index = index;
          li.addEventListener('dragstart', dragStart);
          li.addEventListener('dragend', dragEnd);
          listaJugadores.appendChild(li);
        });
      }

      // Renderizar equipos y sus jugadores asignados
      function renderEquipos() {
        listaEquipos.innerHTML = '';
        equipos.forEach((equipo, equipoIndex) => {
          const divEquipo = document.createElement('div');
          divEquipo.classList.add('equipo');
          divEquipo.innerHTML = `
            <h3>${equipo.nombre}</h3>
            <div class="jugadores-equipo" data-equipo-index="${equipoIndex}"></div>
          `;
          const dropZone = divEquipo.querySelector('.jugadores-equipo');
          dropZone.addEventListener('dragover', dragOver);
          dropZone.addEventListener('drop', drop);
          dropZone.addEventListener('dragleave', dragLeave);

          (equipo.jugadores || []).forEach(jugador => {
            const li = document.createElement('li');
            li.textContent = `${jugador.nombre} (${jugador.clase})`;
            dropZone.appendChild(li);
          });
          listaEquipos.appendChild(divEquipo);
        });
      }

      // Guarda los datos actualizados
      function saveDataEquipos() {
        localStorage.setItem('jugadores', JSON.stringify(jugadores));
        localStorage.setItem('equipos', JSON.stringify(equipos));
      }

      // Agregar un jugador
      btnAgregarJugador.addEventListener('click', () => {
        const nombre = nombreJugadorInput.value.trim();
        const clase = claseJugadorSelect.value;
        if (nombre !== '') {
          const jugador = { nombre, clase };
          jugadores.push(jugador);
          saveDataEquipos();
          renderJugadores();
          nombreJugadorInput.value = '';
        }
      });

      // Agregar un equipo
      btnAgregarEquipo.addEventListener('click', () => {
        const nombreEquipo = nombreEquipoInput.value.trim();
        if (nombreEquipo !== '') {
          const equipo = { nombre: nombreEquipo, jugadores: [] };
          equipos.push(equipo);
          console.log('Equipo agregado:', equipo);
          saveDataEquipos();
          renderEquipos();
          nombreEquipoInput.value = '';
        }
      });

      // Drag & Drop
      let draggedItem = null;
      let draggedIndex = null;

      function dragStart(e) {
        draggedItem = this;
        draggedIndex = this.dataset.index;
        e.dataTransfer.setData('text/plain', this.textContent);
        setTimeout(() => { this.style.display = 'none'; }, 0);
      }
      function dragEnd(e) {
        this.style.display = 'block';
        draggedItem = null;
        draggedIndex = null;
      }
      function dragOver(e) {
        e.preventDefault();
        this.classList.add('drag-over');
      }
      function dragLeave(e) {
        this.classList.remove('drag-over');
      }
      function drop(e) {
        e.preventDefault();
        this.classList.remove('drag-over');
        const equipoIndex = this.dataset.equipoIndex;
        if (draggedIndex !== null) {
          const jugador = jugadores[draggedIndex];
          equipos[equipoIndex].jugadores.push(jugador);
          jugadores.splice(draggedIndex, 1);
          saveDataEquipos();
          renderJugadores();
          renderEquipos();
        }
      }

      renderJugadores();
      renderEquipos();
    }
  } catch (e) {
    console.error("Error en el bloque de Equipos:", e);
  }

  /* ============================
     Bloque de Juego
     ============================ */
  try {
    if (document.getElementById('btnAtaque')) {
      // Combinar jugadores sin asignar y de equipos para el juego
      let allPlayers = [];
      if (localStorage.getItem('jugadores')) {
        let unassigned = JSON.parse(localStorage.getItem('jugadores'));
        unassigned.forEach(player => {
          player.equipo = null;
          allPlayers.push(player);
        });
      }
      if (localStorage.getItem('equipos')) {
        const equiposStorage = JSON.parse(localStorage.getItem('equipos'));
        equiposStorage.forEach(equipo => {
          equipo.jugadores.forEach(player => {
            player.equipo = equipo.nombre;
            allPlayers.push(player);
          });
        });
      }
      // Inicializar atributos si aún no existen
      allPlayers.forEach(player => {
        if (player.vida === undefined) {
          if (player.clase === 'guerrero') {
            player.vida = 10; player.energia = 6;
            player.maxVida = 10; player.maxEnergia = 6;
          } else if (player.clase === 'mago') {
            player.vida = 6; player.energia = 10;
            player.maxVida = 6; player.maxEnergia = 10;
          } else if (player.clase === 'sanador') {
            player.vida = 8; player.energia = 8;
            player.maxVida = 8; player.maxEnergia = 8;
          }
          player.oro = 0; player.xp = 0; player.nivel = 1;
        }
      });

      let pool = [...allPlayers];
      shuffleArray(pool);

      const btnAtaque = document.getElementById('btnAtaque');
      const playerCardDiv = document.getElementById('playerCard');
      const respuestaOpcionesDiv = document.getElementById('respuestaOpciones');
      const respuestaBtns = document.querySelectorAll('.respuesta-btn');
      let jugadorActual = null;

      btnAtaque.addEventListener('click', () => {
        if (pool.length === 0) {
          pool = [...allPlayers];
          shuffleArray(pool);
        }
        jugadorActual = pool.pop();
        mostrarFichaJugador(jugadorActual);
        respuestaOpcionesDiv.style.display = 'flex';
      });

      respuestaBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const respuesta = btn.dataset.respuesta;
          procesarRespuesta(jugadorActual, respuesta);
          actualizarLocalStorageJuego();
          mostrarFichaJugador(jugadorActual);
          respuestaOpcionesDiv.style.display = 'none';
        });
      });

      function mostrarFichaJugador(jugador) {
        if (!playerCardDiv) return; // Seguridad
        playerCardDiv.style.display = 'block';
        playerCardDiv.innerHTML = `
          <h2>${jugador.nombre}</h2>
          <p><strong>Clase:</strong> ${jugador.clase}</p>
          <p><strong>Equipo:</strong> ${jugador.equipo ? jugador.equipo : 'Sin equipo'}</p>
          <p><strong>Vida:</strong> ${jugador.vida} / ${jugador.maxVida}</p>
          <p><strong>Energía:</strong> ${jugador.energia} / ${jugador.maxEnergia}</p>
          <p><strong>Oro:</strong> ${jugador.oro}</p>
          <p><strong>XP:</strong> ${jugador.xp}</p>
          <p><strong>Nivel:</strong> ${jugador.nivel}</p>
          <button id="btnSeguir" class="respuesta-btn">Seguir</button>
        `;
        document.getElementById('btnSeguir').addEventListener('click', () => {
          ocultarFicha();
        });
      }
      function ocultarFicha() {
        playerCardDiv.style.display = 'none';
        respuestaOpcionesDiv.style.display = 'none';
      }
      function procesarRespuesta(jugador, respuesta) {
        if (respuesta === 'acierta') {
          jugador.xp += 150;
          jugador.oro += 10;
          if (jugador.equipo) {
            allPlayers.forEach(p => {
              if (p.equipo === jugador.equipo && p.nombre !== jugador.nombre) {
                p.xp += 10;
                p.oro += 1;
              }
            });
          }
        } else if (respuesta === 'falla') {
          let tieneGuerrero = false;
          if (jugador.equipo) {
            tieneGuerrero = allPlayers.some(p => p.equipo === jugador.equipo && p.clase === 'guerrero');
          }
          if (tieneGuerrero) {
            jugador.vida -= 1;
            allPlayers.forEach(p => {
              if (p.equipo === jugador.equipo && p.clase === 'guerrero') {
                p.energia = Math.max(p.energia - 1, 0);
              }
            });
          } else {
            jugador.vida -= 2;
          }
        }
        while (jugador.xp >= 2000) {
          jugador.xp -= 2000;
          jugador.nivel++;
          jugador.maxVida++;
          jugador.maxEnergia++;
          jugador.oro += 20;
        }
        mostrarFichaJugador(jugador);
      }
      function actualizarLocalStorageJuego() {
        localStorage.setItem('allPlayers', JSON.stringify(allPlayers));
      }
      function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [array[i], array[j]] = [array[j], array[i]];
        }
      }
    }
  } catch (e) {
    console.error("Error en el bloque de Juego:", e);
  }

  /* ============================
     Bloque de Tienda
     ============================ */
  try {
    if (document.getElementById('listaJugadoresTienda')) {
      // Reconstruir allPlayers combinando "jugadores" y los jugadores de "equipos"
      let allPlayers = [];
      if (localStorage.getItem('jugadores')) {
        allPlayers = JSON.parse(localStorage.getItem('jugadores'));
      }
      if (localStorage.getItem('equipos')) {
        const equiposStorage = JSON.parse(localStorage.getItem('equipos'));
        equiposStorage.forEach(equipo => {
          equipo.jugadores.forEach(player => {
            allPlayers.push(player);
          });
        });
      }
      let jugadorSeleccionado = null;
      const listaJugadoresTienda = document.getElementById('listaJugadoresTienda');
      const formFicha = document.getElementById('formFicha');
      const transferenciaDiv = document.getElementById('transferencia');
      const fichaNombre = document.getElementById('fichaNombre');
      const fichaClase = document.getElementById('fichaClase');
      const fichaEquipo = document.getElementById('fichaEquipo');
      const fichaVida = document.getElementById('fichaVida');
      const fichaEnergia = document.getElementById('fichaEnergia');
      const fichaOro = document.getElementById('fichaOro');
      const fichaXP = document.getElementById('fichaXP');
      const btnGuardarFicha = document.getElementById('btnGuardarFicha');
      const listaCompañeros = document.getElementById('listaCompañeros');
      const btnTransferir = document.getElementById('btnTransferir');
      const txtTransferencia = document.getElementById('txtTransferencia');
      const modalCompra = document.getElementById('modalCompra');
      const modalMensaje = document.getElementById('modalMensaje');
      const btnModalSi = document.getElementById('btnModalSi');
      const btnModalNo = document.getElementById('btnModalNo');

      function renderListaJugadores() {
        listaJugadoresTienda.innerHTML = '';
        allPlayers.forEach((jugador, index) => {
          const li = document.createElement('li');
          li.textContent = `${jugador.nombre} (${jugador.clase})`;
          li.dataset.index = index;
          li.addEventListener('click', () => { seleccionarJugador(index); });
          listaJugadoresTienda.appendChild(li);
        });
      }
      function seleccionarJugador(index) {
        jugadorSeleccionado = allPlayers[index];
        fichaNombre.value = jugadorSeleccionado.nombre;
        fichaClase.value = jugadorSeleccionado.clase;
        fichaEquipo.value = jugadorSeleccionado.equipo ? jugadorSeleccionado.equipo : 'Sin equipo';
        fichaVida.value = jugadorSeleccionado.vida;
        fichaEnergia.value = jugadorSeleccionado.energia;
        fichaOro.value = jugadorSeleccionado.oro;
        fichaXP.value = jugadorSeleccionado.xp;
        if (jugadorSeleccionado.clase === 'mago' || jugadorSeleccionado.clase === 'sanador') {
          renderCompañeros();
          transferenciaDiv.style.display = 'block';
          txtTransferencia.textContent = (jugadorSeleccionado.clase === 'mago')
            ? 'Ceder energía: pierde 1, compañero gana 5'
            : 'Ceder vida: gasta 1 energía, compañero recupera 4 vida';
        } else {
          transferenciaDiv.style.display = 'none';
        }
      }
      function renderCompañeros() {
        listaCompañeros.innerHTML = '';
        if (jugadorSeleccionado.equipo) {
          const compañeros = allPlayers.filter(j => j.equipo === jugadorSeleccionado.equipo && j.nombre !== jugadorSeleccionado.nombre);
          compañeros.forEach((compañero, idx) => {
            const option = document.createElement('option');
            option.value = idx;
            option.textContent = `${compañero.nombre} (Vida: ${compañero.vida}/${compañero.maxVida}, Energía: ${compañero.energia}/${compañero.maxEnergia})`;
            listaCompañeros.appendChild(option);
          });
        }
      }
      btnGuardarFicha.addEventListener('click', () => {
        if (jugadorSeleccionado) {
          jugadorSeleccionado.vida = parseInt(fichaVida.value);
          jugadorSeleccionado.energia = parseInt(fichaEnergia.value);
          jugadorSeleccionado.oro = parseInt(fichaOro.value);
          jugadorSeleccionado.xp = parseInt(fichaXP.value);
          guardarPlayers();
          alert('Cambios guardados.');
          renderListaJugadores();
        }
      });
      btnTransferir.addEventListener('click', () => {
        if (!jugadorSeleccionado) return;
        if (listaCompañeros.selectedIndex === -1) {
          alert('Selecciona un compañero.');
          return;
        }
        const compañeroNombre = listaCompañeros.options[listaCompañeros.selectedIndex].textContent.split(' ')[0];
        const compañero = allPlayers.find(j => j.nombre === compañeroNombre && j.equipo === jugadorSeleccionado.equipo);
        if (compañero) {
          if (jugadorSeleccionado.clase === 'mago') {
            if (jugadorSeleccionado.energia >= 1) {
              jugadorSeleccionado.energia -= 1;
              compañero.energia = Math.min(compañero.energia + 5, compañero.maxEnergia);
              alert(`${jugadorSeleccionado.nombre} cedió 1 energía a ${compañero.nombre}.`);
            } else { alert('No tiene suficiente energía para ceder.'); }
          } else if (jugadorSeleccionado.clase === 'sanador') {
            if (jugadorSeleccionado.energia >= 1) {
              jugadorSeleccionado.energia -= 1;
              compañero.vida = Math.min(compañero.vida + 4, compañero.maxVida);
              alert(`${jugadorSeleccionado.nombre} cedió 1 energía para curar a ${compañero.nombre}.`);
            } else { alert('No tiene suficiente energía para curar.'); }
          }
          guardarPlayers();
          seleccionarJugador(allPlayers.findIndex(j => j.nombre === jugadorSeleccionado.nombre));
        }
      });
      function guardarPlayers() {
        localStorage.setItem('allPlayers', JSON.stringify(allPlayers));
      }
      // Objetos (pociones)
      const objetos = document.querySelectorAll('.objeto img');
      objetos.forEach(img => {
        img.addEventListener('click', () => {
          if (!jugadorSeleccionado) {
            alert('Primero selecciona un jugador.');
            return;
          }
          const tipo = img.dataset.objeto;
          let costo, mensaje;
          if (tipo === 'potion1') {
            costo = 60;
            mensaje = `La poción de vida cuesta ${costo} mo, ¿deseas comprarla?`;
          } else if (tipo === 'potion2') {
            costo = 40;
            mensaje = `La poción de energía cuesta ${costo} mo, ¿deseas comprarla?`;
          } else if (tipo === 'potion3') {
            costo = 50;
            mensaje = `La poción de sabiduría cuesta ${costo} mo, ¿deseas comprarla?`;
          }
          modalMensaje.textContent = mensaje;
          modalCompra.style.display = 'flex';
          btnModalSi.onclick = () => {
            if (jugadorSeleccionado.oro >= costo) {
              jugadorSeleccionado.oro -= costo;
              if (tipo === 'potion1') {
                jugadorSeleccionado.vida = jugadorSeleccionado.maxVida;
              } else if (tipo === 'potion2') {
                jugadorSeleccionado.energia = jugadorSeleccionado.maxEnergia;
              } else if (tipo === 'potion3') {
                jugadorSeleccionado.xp += 200;
              }
              guardarPlayers();
              alert('Compra realizada.');
              seleccionarJugador(allPlayers.findIndex(j => j.nombre === jugadorSeleccionado.nombre));
            } else {
              alert('No tiene suficiente oro.');
            }
            modalCompra.style.display = 'none';
          };
          btnModalNo.onclick = () => { modalCompra.style.display = 'none'; };
        });
      });
      renderListaJugadores();
    }
  } catch (e) {
    console.error("Error en el bloque de Tienda:", e);
  }

  /* ============================
     Bloque de Conductas
     ============================ */
  try {
    if (document.getElementById('selectJugador')) {
      let allPlayers = localStorage.getItem('allPlayers')
        ? JSON.parse(localStorage.getItem('allPlayers'))
        : [];
      const selectJugador = document.getElementById('selectJugador');
      const jugadorInfo = document.getElementById('jugadorInfo');
      const infoNombre = document.getElementById('infoNombre');
      const infoClase = document.getElementById('infoClase');
      const infoEquipo = document.getElementById('infoEquipo');
      const infoVida = document.getElementById('infoVida');
      const infoEnergia = document.getElementById('infoEnergia');
      const infoOro = document.getElementById('infoOro');
      const infoXP = document.getElementById('infoXP');

      function renderSelectConductas() {
        selectJugador.innerHTML = '<option value="">-- Selecciona un jugador --</option>';
        allPlayers.forEach((player, index) => {
          const option = document.createElement('option');
          option.value = index;
          option.textContent = `${player.nombre} (${player.clase})`;
          selectJugador.appendChild(option);
        });
      }
      function mostrarInfoConductas(index) {
        if(index === "") { jugadorInfo.style.display = 'none'; return; }
        const player = allPlayers[index];
        infoNombre.textContent = "Nombre: " + player.nombre;
        infoClase.textContent = "Clase: " + player.clase;
        infoEquipo.textContent = "Equipo: " + (player.equipo ? player.equipo : "Sin equipo");
        infoVida.textContent = "Vida: " + player.vida;
        infoEnergia.textContent = "Energía: " + player.energia;
        infoOro.textContent = "Oro: " + player.oro;
        infoXP.textContent = "XP: " + player.xp;
        jugadorInfo.style.display = 'block';
      }
      renderSelectConductas();
      selectJugador.addEventListener('change', (e) => {
        const index = e.target.value;
        mostrarInfoConductas(index);
      });
      document.getElementById('btnBuenTrabajo').addEventListener('click', () => {
        const index = selectJugador.value;
        if(index === "") { alert("Selecciona un jugador primero."); return; }
        allPlayers[index].xp += 50;
        allPlayers[index].oro += 5;
        localStorage.setItem('allPlayers', JSON.stringify(allPlayers));
        mostrarInfoConductas(index);
        alert("Premio aplicado: +50 XP y +5 Oro.");
      });
      document.getElementById('btnExcelente').addEventListener('click', () => {
        const index = selectJugador.value;
        if(index === "") { alert("Selecciona un jugador primero."); return; }
        allPlayers[index].xp += 75;
        allPlayers[index].oro += 7;
        localStorage.setItem('allPlayers', JSON.stringify(allPlayers));
        mostrarInfoConductas(index);
        alert("Premio aplicado: +75 XP y +7 Oro.");
      });
      document.getElementById('btnDeberiasMejorar').addEventListener('click', () => {
        const index = selectJugador.value;
        if(index === "") { alert("Selecciona un jugador primero."); return; }
        allPlayers[index].vida -= 3;
        localStorage.setItem('allPlayers', JSON.stringify(allPlayers));
        mostrarInfoConductas(index);
        alert("Castigo aplicado: -3 Vida.");
      });
    }
  } catch (e) {
    console.error("Error en el bloque de Conductas:", e);
  }

  /* ============================
     Bloque de Sentencias
     ============================ */
  try {
    if (document.getElementById('listaCaidos')) {
      // En este bloque se filtran dinámicamente los jugadores con vida <= 0
      let allPlayers = localStorage.getItem('allPlayers')
        ? JSON.parse(localStorage.getItem('allPlayers'))
        : [];
      let caidos = allPlayers.filter(player => player.vida <= 0);
      const listaCaidos = document.getElementById('listaCaidos');
      const sentencias = [
        "Cantar una canción",
        "Trabajo de lengua",
        "Trabajo de mates",
        "Trabajo de inglés",
        "Haz un dibujo",
        "Escribe un poema",
        "Lee un libro en una semana",
        "Te has librado"
      ];

      function renderCaidos() {
        listaCaidos.innerHTML = "";
        caidos.forEach((alumno, index) => {
          const li = document.createElement('li');
          li.classList.add('caido-item');
          li.innerHTML = `<span>${alumno.nombre} ${alumno.sentencia ? "- " + alumno.sentencia : ""}</span>`;
          if (!alumno.sentencia) {
            const btnSentencia = document.createElement('button');
            btnSentencia.textContent = "Sentencia";
            btnSentencia.classList.add('btn');
            btnSentencia.id = "btnSentencia";
            btnSentencia.addEventListener('click', () => { asignarSentencia(index, btnSentencia); });
            li.appendChild(btnSentencia);
          } else {
            const btnCumplido = document.createElement('button');
            btnCumplido.textContent = "Cumplido";
            btnCumplido.classList.add('btn');
            btnCumplido.id = "btnCumplido";
            btnCumplido.addEventListener('click', () => { cumplido(index); });
            li.appendChild(btnCumplido);
          }
          listaCaidos.appendChild(li);
        });
      }
      function asignarSentencia(index, btn) {
        let contador = 0;
        const intervalo = setInterval(() => {
          const randomSentencia = sentencias[Math.floor(Math.random() * sentencias.length)];
          btn.textContent = randomSentencia;
          btn.classList.add('roulette');
          contador++;
          if (contador >= 15) {
            clearInterval(intervalo);
            const sentenciaFinal = sentencias[Math.floor(Math.random() * sentencias.length)];
            caidos[index].sentencia = sentenciaFinal;
            actualizarCaidos();
            renderCaidos();
            alert(`Sentencia asignada a ${caidos[index].nombre}: ${sentenciaFinal}`);
          }
        }, 100);
      }
      function cumplido(index) {
        alert(`${caidos[index].nombre} ha cumplido su sentencia y recupera 2 puntos de vida.`);
        caidos[index].sentencia = "";
        // Aquí podrías actualizar la vida del jugador en allPlayers si fuera necesario.
        actualizarCaidos();
        renderCaidos();
      }
      function actualizarCaidos() {
        localStorage.setItem('allPlayers', JSON.stringify(allPlayers));
      }
      renderCaidos();
    }
  } catch (e) {
    console.error("Error en el bloque de Sentencias:", e);
  }

});
