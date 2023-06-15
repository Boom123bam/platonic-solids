import * as THREE from "three";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

// Scroll to top button
document.querySelector(".back").addEventListener("click", () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
});

const snapInc = 23;

const backgroundColor = "#111";

const canvasContainer = document.getElementById("canvas-container");

const scene = new THREE.Scene();
const frustumSize = 9;
let aspect = window.innerWidth / window.innerHeight;

scene.fog = new THREE.Fog(backgroundColor, 10, 15);
// scene.fog = new THREE.FogExp2(backgroundColor, 0.15);

// const camera = new THREE.PerspectiveCamera(
//   80,
//   window.innerWidth / window.innerHeight,
//   0.1,
//   1000
// );
// camera.position.set(0, 0, 15);

const camera = new THREE.OrthographicCamera(
  (frustumSize * aspect) / -2,
  (frustumSize * aspect) / 2,
  frustumSize / 2,
  frustumSize / -2,
  0,
  20
);
camera.position.set(0, 0, 2.5);

scene.add(camera);

camera.lookAt(new THREE.Vector3(0, 0, 0));

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true,
});
renderer.setPixelRatio(1);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(backgroundColor, 0);

window.addEventListener(
  "resize",
  function () {
    aspect = window.innerWidth / window.innerHeight;

    camera.left = (frustumSize * aspect) / -2;
    camera.right = (frustumSize * aspect) / 2;
    camera.top = frustumSize / 2;
    camera.bottom = frustumSize / -2;

    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  },
  false
);

canvasContainer.appendChild(renderer.domElement);

// #####################################
// ############# SOLIDS ################
// #####################################

function alphaMap(alpha = 0.8) {
  const canvas = document.createElement("canvas"),
    ctx = canvas.getContext("2d"),
    width = (canvas.width = 128),
    height = (canvas.height = 128);

  ctx.fillStyle = "#FFF";
  ctx.fillRect(0, 0, width, height);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, width, height);

  const textureLoader = new THREE.TextureLoader();
  const texture = textureLoader.load(canvas.toDataURL());
  return texture;
}

const tex = alphaMap();

const cores = [];

function addSolid(
  geo,
  color,
  babies,
  image = "texture.jpeg",
  pos = [0, 0],
  imgScale = 1
) {
  const mat = new THREE.MeshBasicMaterial({
    depthTest: false,
    transparent: true,
    alphaMap: tex,
    opacity: 0.95,
    // side: THREE.DoubleSide
  });

  const edgeMat = new THREE.LineBasicMaterial({
    color: color,
    transparent: true,
    opacity: 0.5,
  });

  const solid = new THREE.Mesh(geo, mat);
  const edge = new THREE.LineSegments(
    new THREE.EdgesGeometry(geo),
    edgeMat
  );

  solid.material.color.set(color);

  const solidGroup = new THREE.Group();

  for (let i = 0, total = babies + 1; i < total; i++) {
    let clone = solid.clone();

    clone.material = clone.material.clone();
    let colorOffset = 0.25 * (i / total);
    let scale = 1 - 0.1 * i;
    clone.scale.set(scale, scale, scale);
    if (i == babies) {
      let texture = new THREE.TextureLoader().load(image);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      clone.material.alphaMap = texture;
      clone.material.alphaMap.repeat.set(imgScale, imgScale);
      clone.material.opacity = 1;
      cores.push(clone);
    } else {
      clone.material.color.offsetHSL(
        colorOffset,
        colorOffset,
        colorOffset
      );
      let edgeClone = edge.clone();
      edgeClone.material = edgeClone.material.clone();
      edgeClone.material.opacity = scale;
      edgeClone.material.color.offsetHSL(
        colorOffset,
        colorOffset,
        colorOffset
      );
      edgeClone.scale.set(scale, scale, scale);
      solidGroup.add(edgeClone);
    }
    solidGroup.add(clone);
  }
  solidGroup.position.set(pos[0], 0, pos[1]);

  return solidGroup;
}

// ########### ADD SOLIDS ##############

const size = 1.75;
const babies = 1;
const geo1 = new THREE.TetrahedronGeometry(size);
const geo2 = new THREE.BoxGeometry(
  Math.sqrt(2 * size),
  Math.sqrt(2 * size),
  Math.sqrt(2 * size)
);
const geo3 = new THREE.OctahedronGeometry(size);
const geo4 = new THREE.IcosahedronGeometry(size);
const geo5 = new THREE.DodecahedronGeometry(size);

const solidGroups = [
  addSolid(geo1, "#FF4500", babies, "fire.jpeg"),
  addSolid(geo2, "#00ff77", babies, "earth.avif"),
  addSolid(geo3, "#87CEEB", babies, "wind.jpeg"),
  addSolid(geo4, "#00ddff", babies, "water.jpeg"),
  addSolid(geo5, "#aaaaff", babies, "ether.jpeg"),
];

solidGroups.forEach((solid) => {
  scene.add(solid);
  solid.visible = false;
});

function updateSolidsPos(prog) {
  const x = prog * snapInc - 2;
  const solidNum = Math.floor((x + 1) / 4);

  // Visibility
  solidGroups.forEach((solid, i) => {
    if (solidNum != 5) {
      if (i !== solidNum) solid.visible = false;
      else solid.visible = true;
    } else {
      solid.visible = true;
    }
  });
  if (solidNum != -1 && solidNum != 6) {
    // Update cam
    const panProgress = 1 - (((x + 1) / 4) % 1);
    camera.position.y = (panProgress - 0.5) * 10;
    camera.lookAt(new THREE.Vector3(0, 0, 0));

    // Transition
    if ((x + 4) % 4 > 2) {
      const transitionProgress = (((x + 4) % 4) - 2) / 2;
      if (transitionProgress < 0.5) {
        if (solidNum == 5) {
          solidGroups.forEach((solid) => {
            solid.position.z = 0 - transitionProgress * 25;
          });
        } else {
          solidGroups[solidNum].position.z =
            0 - transitionProgress * 25;
        }
      } else {
        if (solidNum == 5) {
          solidGroups.forEach((solid) => {
            solid.position.z = 25 * transitionProgress - 25;
          });
        } else
          solidGroups[solidNum].position.z =
            25 * transitionProgress - 25;
      }
    } else {
      if (solidNum == 5) {
        solidGroups.forEach((solid) => {
          solid.position.z = 0;
        });
      } else solidGroups[solidNum].position.z = 0;
    }
  }
}

// #####################################
// ############## STARS ################
// #####################################
function createStars() {
  const starCount = 100;

  const starsContainer = document.querySelector("#stars");

  const stars = [];

  for (let i = 0; i < starCount; i++) {
    const star = document.createElement("div");
    const xPos = Math.random() * 100;
    star.className = "star";
    star.style.top = `${Math.random() * 100}%`;
    star.size = Math.ceil(Math.random() * 5);
    star.style.width = `${star.size}px`;
    star.style.height = `${star.size}px`;
    star.xPos = xPos;
    star.vel = Math.random() / 50 + 0.05;
    starsContainer.appendChild(star);
    stars.push(star);
  }
  return stars;
}
const stars = createStars();

function moveStars() {
  stars.forEach((star) => {
    let pos = star.xPos;
    if (pos > 100) {
      star.xPos = -5;
      star.style.left = -5;
    } else {
      star.xPos = pos + star.vel;
      star.style.left = `${pos + star.vel}%`;
    }
  });
}
const proxy = { vel: 0 };

let yClamp = gsap.utils.clamp(-3000, 3000);
let hClamp = gsap.utils.clamp(-1500, 1500);

function updateStars(vel) {
  stars.forEach((star) => {
    star.style.height = `${
      Math.abs(hClamp((vel * star.size) / 5)) * 0.02 + star.size
    }px`;
    if (vel > 0)
      star.style.transform = `translateY(${
        -yClamp((vel * star.size) / 5) * 0.08
      }px)`;
    else
      star.style.transform = `translateY(${
        -yClamp((vel * star.size) / 5) * 0.06
      }px)`;
  });
}

// #####################################
// ############### GSAP ################
// #####################################
gsap.registerPlugin(ScrollTrigger);

gsap.defaults({
  ease: "linear",
});

const slides = [".one", ".two", ".three", ".four", ".five"];

slides.forEach((slide, index) => {
  gsap.from(`${slide} .side`, {
    height: 0,
    scrollTrigger: {
      trigger: slide,
      start: "top top",
      end: "bottom top",
      scrub: 1,
      pin: true,
      id: `slide-${index + 1}`,
    },
  });
});

// snap positions
const snap = [0];
for (let i = 0; i <= 21; i++) {
  if (i % 4 !== 3) {
    snap.push((i + 2) / snapInc);
  }
}
snap.splice(-2, 1);
snap.push(1);

gsap.to(".container", {
  scrollTrigger: {
    trigger: ".container",
    snap,
    id: "container",
    start: "top top",
    end: "bottom bottom",
    refreshPriority: -1,
    onUpdate: (self) => {
      console.log(camera.position);
      updateSolidsPos(self.progress);
      const vel = self.getVelocity();
      proxy.vel = vel;
      gsap.to(proxy, {
        vel: 0,
        overwrite: true,
        onUpdate: () => updateStars(proxy.vel),
        ease: "power3",
      });
    },
  },
});

// #####################################
// ############# RENDER ################
// #####################################

function render(time) {
  time *= 0.001;

  solidGroups.forEach((group) => {
    group.rotation.y = time / 2;
  });

  cores.forEach((s) => {
    s.material.alphaMap.offset.set(100, -time / 10);
  });

  requestAnimationFrame(render);
  renderer.render(scene, camera);
  moveStars();
}

requestAnimationFrame(render);
