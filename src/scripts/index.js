import { PerspectiveCamera, WebGLRenderer, Scene, Vector2 } from 'three';
import { OrbitControls } from './OrbitControls';
import MainStage from './MainStage.js';

import { isMobile } from 'mobile-device-detect';

import '../styles/index.scss';
import Tween from '@tweenjs/tween.js';


if (process.env.NODE_ENV === 'development') {
  require('../index.html');
}

class App {
  constructor() {
      this.container = document.getElementById('canvas-container');

      this.containerWidth = this.container.clientWidth;
      this.containerHeight = this.container.clientHeight;

      this.camera = new PerspectiveCamera(70, this.containerWidth / this.containerHeight, 0.1, 10000);
      this.camera.position.set(0, 0, 0.1);

      this.renderer = new WebGLRenderer({antialias: true, alpha: true});

      this.renderer.autoClear = true;
      this.renderer.setClearColor('#555555');

      this.renderer.setSize(this.containerWidth, this.containerHeight);
      this.container.appendChild(this.renderer.domElement);

      this.controls = new OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enabled = true;

      this.controls.screenSpacePanning = false;
      this.controls.rotateSpeed = -0.3;
      this.controls.enableZoom = false;
      this.controls.enableKeys = true;

      this.leftArrowPressed = false;
      this.rightArrowPressed = false;
      this.upArrowPressed = false;
      this.downArrowPressed = false;

      this.rotateByAngle = {yaw: 0, pitch: 0};

      this.controls.target.set(0, 0, 0);

      this.controls.enableDamping = isMobile ? false : true;
      this.controls.dampingFactor = 0.05;

      this.zoomState = 0.5;
      this.zoomMin = 0.2;
      this.zoomMax = 3;

      this.followControls = false;
      this.mouseDown = false;

      this.fStartPosition = new Vector2();
      this.followDirrection = new Vector2();

      this.touchPrevPosition = new Vector2();
      this.touchCurrent = new Vector2();
      this.touchFollowDirrection = new Vector2();
      this.touchInertia = false;

      this.scale = false;
      this.startGestDistance = 0;

      this.dragModeButton = document.getElementById('drag-button');
      this.followModeButton = document.getElementById('follow-button');
      this.controlsContainer = document.getElementById('controls-container');

      this.scene = new Scene();
      this.init();
  }

    init() {
        this.controlsContainer.classList.remove('hidden');

        isMobile && this.controlsContainer.classList.add('mobile');

        this.mainStage = new MainStage();

        this.scene.add(this.mainStage.mainContainer);
        this.mainStage.init();

        this.start();
        this.resizeEvent();
        this.events();

        this.animateZoom();
    }


    start = () => {
        if (!this.frameId) {
            this.frameId = requestAnimationFrame(this.animate);
        }
    }

    stop = () => {
        this.removeEvents();

        cancelAnimationFrame(this.frameId);

        this.container.removeChild(this.renderer.domElement);

        this.clearScene();
    }

    animate = () => {
        Tween.update();
        this.updateFov();
        this.rotateCamera();
        this.controls.update();

        this.renderer.render(this.scene, this.camera);

        this.frameId = window.requestAnimationFrame(this.animate);
    }

    updateRender = () => {
        this.containerWidth = this.container.clientWidth;
        this.containerHeight = this.container.clientHeight;

        this.camera.aspect = this.containerWidth / this.containerHeight;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(this.containerWidth, this.containerHeight);
    }


    clearScene() {
        // todo
        while(this.scene.children[0]) {
            this.scene.remove(this.scene.children[0]);
        }
    }

    events() {
        window.addEventListener("keydown",(event) => {
            if (event.defaultPrevented) {
                return;
            }
        
            var handled = false;

            if (event.key !== undefined) {
                event.key === 'ArrowLeft' && (this.leftArrowPressed = true);
                event.key === 'ArrowRight' && (this.rightArrowPressed = true);
                event.key === 'ArrowUp' && (this.upArrowPressed = true);
                event.key === 'ArrowDown' && (this.downArrowPressed = true);
                
            }
        
            if (handled) {
                // Suppress "double action" if event handled
                event.preventDefault();
            }
        }, true);

        window.addEventListener("keyup", (event) => {
            if (event.key !== undefined) {
                event.key === 'ArrowLeft' && (this.leftArrowPressed = false);
                event.key === 'ArrowRight' && (this.rightArrowPressed = false);
                event.key === 'ArrowUp' && (this.upArrowPressed = false);
                event.key === 'ArrowDown' && (this.downArrowPressed = false);
            }
        });

        document.getElementById("fs-button").addEventListener('click', () => {
            this.toggleFullScreen();
        });

        window.addEventListener('wheel', (event) => {
            this.zoomState += 0.0005 * -event.deltaY;

            this.zoomState = (this.zoomState < this.zoomMin) ? this.zoomMin : ((this.zoomState > this.zoomMax) ? this.zoomMax : this.zoomState); 
        });

        if (isMobile) {
            this.container.addEventListener('touchstart', (e) => {
                this.scaling = false;
                if (e.touches.length === 2) {
                    this.scaling = true;
                    this.startGestDistance = this.getDistance(e);
                }
                this.touchInertia = false;
                this.touchPrevPosition.set(0, 0);
                this.touchCurrent.set(0, 0);
            });

            this.container.addEventListener('touchmove', (e) => {
                if (this.scaling && e.touches.length === 2) {
                    const dist = this.getDistance(e);
                    const diff =  dist - this.startGestDistance;
                    this.startGestDistance = dist;

                    this.zoomState += 0.015 * diff;

                    this.zoomState = (this.zoomState < this.zoomMin) ? this.zoomMin : ((this.zoomState > this.zoomMax) ? this.zoomMax : this.zoomState);
                    
                    //
                    this.touchPrevPosition.set(0, 0);
                    this.touchCurrent.set(0, 0);
                    
                } else if (e.touches.length === 1) {
                    this.touchCurrent.set(e.touches[0].pageX / this.container.clientWidth, 1 - (e.touches[0].pageY / this.container.clientHeight));
                }
            });

            this.container.addEventListener('touchend', (e) => {
                if(this.scaling) {
                    this.startGestDistance = 0;
                    this.touchPrevPosition.set(0, 0);
                    this.touchCurrent.set(0, 0);
                } else {
                    this.touchInertia = true;
                }
            });
        } 

        window.addEventListener('mousedown', (event) => {
            this.mouseDown = true;
            this.fStartPosition.set(event.clientX / this.container.clientWidth, 1 - (event.clientY / this.container.clientHeight));
        });

        window.addEventListener('mousemove', (event) => {
            if(this.mouseDown) {
                const curpos = new Vector2(event.clientX / this.container.clientWidth, 1 - (event.clientY / this.container.clientHeight));
                this.followDirrection.copy(curpos.sub(this.fStartPosition));
            }
        });

        window.addEventListener('mouseup', (event) => {
            this.mouseDown = false;
            this.fStartPosition.set(0, 0);
            this.followDirrection.set(0, 0);
        });
        
        this.dragModeButton.addEventListener('click', () => {
            this.toggleControlMode('drag');
        });

        this.followModeButton.addEventListener('click', () => {
            this.toggleControlMode('follow');
        });
    }

    resizeEvent() {
        window.addEventListener('resize', this.updateRender);
    }

    removeEvents() {
        window.removeEventListener('resize', this.updateRender);
    }

    toggleControlMode(mode) {

        if(mode === 'drag') {
            this.controls.enabled = true;
            this.followControls = false;
            this.dragModeButton.classList.add('active');
            this.followModeButton.classList.remove('active');
        } else if (mode === 'follow') {
            this.controls.enabled = false;
            this.followControls = true;
            this.dragModeButton.classList.remove('active');
            this.followModeButton.classList.add('active');
        }

    }

    toggleFullScreen() {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen();
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen(); 
                }
            }
    }

    updateFov() {
        const nf = 75 - this.zoomState * 15;
        if (nf !== this.camera.fov) {
            this.camera.fov = nf;
            this.camera.updateProjectionMatrix();
        }
    }

    rotateCamera() {
        const speed = 0.04;

        if (this.leftArrowPressed || this.rightArrowPressed) {
            const direction = this.leftArrowPressed ? -1 : 1;
            const angle = speed * direction;

            this.rotateByAngle.yaw += angle;
        }

        if (this.upArrowPressed || this.downArrowPressed) {
            const direction = this.downArrowPressed ? -1 : 1;
            const angle = speed * direction;

            this.rotateByAngle.pitch += angle;
        }

        if (this.followControls && this.mouseDown) {
            this.rotateByAngle.yaw += this.followDirrection.x * speed * 1.5;
            this.rotateByAngle.pitch += this.followDirrection.y * speed * 1.5;
        }

        // mobile

        if (isMobile && !this.scaling) {
            if (!this.touchPrevPosition.equals(this.touchCurrent)) {
                this.touchFollowDirrection.subVectors(this.touchPrevPosition, this.touchCurrent);
                this.touchPrevPosition.copy(this.touchCurrent);

                if (this.touchFollowDirrection.y > 0.4 || this.touchFollowDirrection.x > 0.6) {
                    this.touchFollowDirrection.set(0, 0);
                }
            }
        }

        if (isMobile && this.touchInertia) {
            this.rotateByAngle.yaw += this.touchFollowDirrection.x * 4;
            this.rotateByAngle.pitch += this.touchFollowDirrection.y * 4;

            this.touchFollowDirrection.set(0, 0);
        }

        this.updateCamera();

    }

    updateCamera() {
        const offsetYaw = this.rotateByAngle.yaw * 0.07;
        this.rotateByAngle.yaw -= offsetYaw;
        if (Math.abs(this.rotateByAngle.yaw) < 0.001) {this.rotateByAngle.yaw = 0;}

        const offsetPitch = this.rotateByAngle.pitch * 0.07;
        this.rotateByAngle.pitch -= offsetPitch;
        if (Math.abs(this.rotateByAngle.pitch) < 0.001) {this.rotateByAngle.pitch = 0;}

        if (offsetYaw !== 0) {
            const pos = this.camera.position.clone();

            const newPos = new Vector2(
                Math.cos(offsetYaw) * pos.x - Math.sin(offsetYaw) * pos.z,
                Math.sin(offsetYaw) * pos.x + Math.cos(offsetYaw) * pos.z,
            );
    
            this.camera.position.x = newPos.x;
            this.camera.position.z = newPos.y;
        }

        if (offsetPitch !== 0) {
            const posN = this.camera.position.clone();
            const xz = Math.sqrt(posN.x**2 + posN.z**2);
    
            const newPosV = {
                y: Math.cos(offsetPitch) * posN.y - Math.sin(offsetPitch) * xz,
                xz: Math.sin(offsetPitch) * posN.y + Math.cos(offsetPitch) * xz,
            };

            if (newPosV.xz < 0.001) {newPosV.xz = 0.001;}
    
            this.camera.position.x = posN.x * newPosV.xz / xz;
            this.camera.position.z = posN.z * newPosV.xz / xz;
    
            this.camera.position.y = newPosV.y;
        }
    }

    animateZoom() {
        const tween = new Tween.Tween({alpha: 0})
            .delay(700)
            .to({alpha: 1}, 1800)
            .easing(Tween.Easing.Quadratic.InOut)
            .onUpdate((delta) => {
                this.zoomState = 0.5 + 0.5 * delta.alpha;
            })
            .onComplete(() => {
                tween.stop();
            })
            .start(undefined);
    }

    getDistance(e) {
        const dist = Math.hypot(
            e.touches[0].pageX - e.touches[1].pageX,
            e.touches[0].pageY - e.touches[1].pageY
        );

        return dist;
    }

}

new App();
