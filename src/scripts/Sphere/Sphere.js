import { Group, Mesh, MeshBasicMaterial, SphereBufferGeometry, TextureLoader } from "three";

export default class Sphere {
    constructor(config) {
        this.active = false;
        this.loaded = false;
        this.hiresLoaded = false;

        this.mainContainer = new Group();

        this.sphereContainer = new Group();
        this.sphereContainer.scale.set(-1, 1, 1);

        this.texturesState = 0;

        this.materials = [];
        this.meshes = [];

        this.config = config;

        this.init();
    }

    init() {

        const phL = Math.PI / 4;
        const geo = new SphereBufferGeometry(100, 6, 48, 0, phL);

        for(let i = 0; i < 8; i++) {
            const material = new MeshBasicMaterial({color: '#ffffff', side: 2});

            this.materials.push(material);

            const mesh = new Mesh(geo, material);
            mesh.rotation.y = phL * i;

            mesh.userData = {
                material: material,
                part: i
            };

            this.meshes.push(mesh); 
            this.sphereContainer.add(mesh);
        }

        this.meshes.forEach((mesh) => {
            const {material, part} = mesh.userData;
            new TextureLoader().load(this.config.path + `${part}_small.jpg`, (texture) => {
                material.map = texture;
                material.needsUpdate = true;

                this.texturesState++;
                if (this.texturesState >= 8) {
                    this.ready();
                }
            });
        });

    }

    setActive() {
        this.active = true;
        this.loaded && !this.hiresLoaded && this.loadHRes();
    }

    ready() {
        this.mainContainer.add(this.sphereContainer);
        this.loaded = true;
        this.active && this.loadHRes();
    }
    

    loadHRes() {
        this.hiresLoaded = true;
        this.meshes.forEach((mesh) => {
            const {material, part} = mesh.userData;
            new TextureLoader().load(this.config.path + `${part}.jpg`, (texture) => {
                material.map = texture;
                material.needsUpdate = true;
            });
        });
    }
}