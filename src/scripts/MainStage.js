import { Group } from "three";

import Sphere from "./Sphere/Sphere";

const config = [
    {
        name: 'sphere1',
        path: './public/images/1/'
    },
    {
        name: 'sphere2',
        path: './public/images/0/'
    }
];

export default class MainStage {
    constructor() {
        this.mainContainer = new Group();

        this.activeSphere = null;

        this.pano1Button = document.getElementById('pano1-button');
        this.pano2Button = document.getElementById('pano2-button');

    }

    init() {
        this.prepareSpheres(); 
        this.events();
    }

    prepareSpheres() {
        this.spheres = [];

        config.forEach((conf) => {
            const sphere = new Sphere({path: conf.path});

            this.spheres.push({
                name: conf.name,
                sphere: sphere,
                confing: conf
            });
        });

        this.setSphere(this.spheres[0]);
    }

    events() {
        this.pano1Button.addEventListener('click', () => {
            this.swapSphere('sphere1');
            this.pano1Button.classList.add('active');
            this.pano2Button.classList.remove('active');
        });

        this.pano2Button.addEventListener('click', () => {
            this.swapSphere('sphere2');
            this.pano1Button.classList.remove('active');
            this.pano2Button.classList.add('active');
        });
    }

    swapSphere(name) {
        this.spheres.forEach((sph) => {
            if(sph.name === name) {
                this.setSphere(sph);
            }
        });
    }

    setSphere(object) {
        if (object !== this.activeSphere) {
            if(this.activeSphere) {
                this.mainContainer.remove(this.activeSphere.sphere.mainContainer);
            }

            this.activeSphere = object;

            this.mainContainer.add(object.sphere.mainContainer);
            object.sphere.setActive();
        } 
    }
}