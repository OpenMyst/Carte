
export const addCloudLayer = (map) => {
    for (let i = 0; i < 100; i++) {
      const el = document.createElement("div");
      el.className = "cloud";
      el.style.width = "100px";
      el.style.height = "60px";
      el.style.backgroundColor = "rgba(255, 255, 255, 0.8)";
      el.style.borderRadius = "50%";
      el.style.position = "absolute";
      el.style.top = `${Math.random() * (window.innerHeight / 2)}px`;
      el.style.left = `${Math.random() * window.innerWidth}px`;
      el.style.animation = `float ${Math.random() * 10 + 10}s linear infinite`;
      map.getCanvasContainer().appendChild(el);
    }

    const styleElement = document.createElement("style");
    styleElement.innerHTML = `
          @keyframes float {
            0% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(${window.innerWidth}px);
            }
          }
        `;
    document.head.appendChild(styleElement);
  };

export const addSnowLayer = (map) => {
    for (let i = 0; i < 1000; i++) {
      const el = document.createElement("div");
      el.className = "snow-flake";
      el.style.width = "5px";
      el.style.height = "5px";
      el.style.backgroundColor = "rgba(255, 255, 255, 0.8)";
      el.style.borderRadius = "50%";
      el.style.position = "absolute";
      el.style.top = `${Math.random() * window.innerHeight}px`;
      el.style.left = `${Math.random() * window.innerWidth}px`;
      el.style.animation = `fall ${Math.random() * 2 + 3}s linear infinite`;

      map.getCanvasContainer().appendChild(el);
    }

    const styleElement = document.createElement("style");
    styleElement.innerHTML = `
          @keyframes fall {
            0% {
              transform: translateY(0);
              opacity: 1;
            }
            100% {
              transform: translateY(${window.innerHeight}px);
              opacity: 0;
            }
          }
        `;
    document.head.appendChild(styleElement);
  };

export const addRainLayer = (map) => {
    for (let i = 0; i < 1000; i++) {
      const el = document.createElement("div");
      el.className = "rain-drop";
      el.style.width = "2px";
      el.style.height = "10px";
      el.style.backgroundColor = "rgba(0, 150, 255, 0.7)";
      el.style.position = "absolute";
      el.style.top = `${Math.random() * window.innerHeight}px`;
      el.style.left = `${Math.random() * window.innerWidth}px`;
      el.style.animation = `fall ${Math.random() * 2 + 1}s linear infinite`;

      map.getCanvasContainer().appendChild(el);
    }

    const styleElement = document.createElement("style");
    styleElement.innerHTML = `
          @keyframes fall {
            0% {
              transform: translateY(0);
              opacity: 1;
            }
            100% {
              transform: translateY(${window.innerHeight}px);
              opacity: 0;
            }
          }
        `;
    document.head.appendChild(styleElement);
  };

export const addWindLayer = (map) => {
    for (let i = 0; i < 1000; i++) {
      const el = document.createElement("div");
      el.className = "wind-blow";
      el.style.width = "10px";
      el.style.height = "2px";
      el.style.backgroundColor = "rgba(255, 255, 255, 0.7)";
      el.style.position = "absolute";
      el.style.top = `${Math.random() * window.innerHeight}px`;
      el.style.left = `${Math.random() * window.innerWidth}px`;
      el.style.animation = `blow ${Math.random() * 3 + 2}s linear infinite`;

      map.getCanvasContainer().appendChild(el);
    }

    const styleElement = document.createElement("style");
    styleElement.innerHTML = `
          @keyframes blow {
            0% {
              transform: translateX(0);
              opacity: 1;
            }
            100% {
              transform: translateX(${window.innerWidth}px);
              opacity: 0;
            }
          }
        `;
    document.head.appendChild(styleElement);
  };