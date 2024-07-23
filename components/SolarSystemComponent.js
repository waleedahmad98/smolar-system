// components/SolarSystem.js
import React, { useEffect, useState, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';


// Function to create an orbit path
const createOrbitPath = (radius) => {
    const segments = 64;
    const orbitGeometry = new THREE.BufferGeometry();
    const positions = [];

    for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        positions.push(radius * Math.cos(theta), 0, radius * Math.sin(theta));
    }

    orbitGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const orbitMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
    return new THREE.Line(orbitGeometry, orbitMaterial);
};

const updatePlanetInfo = (targetPlanet) => {
    var old = document.getElementById("info-container")
    debugger;
    if (old !== null){
        old.remove();
    }
    
    var infoContainer = document.createElement("div");
    infoContainer.id = "info-container";
    infoContainer.style.background = '#1f1f1f'
    infoContainer.style.padding = '10px'
    infoContainer.style.position = 'absolute';
    infoContainer.style.display = 'flex';
    infoContainer.style.flexDirection = 'column';
    infoContainer.style.top = '0';
    infoContainer.style.marginLeft = '10px';
    infoContainer.style.marginTop = '10px';
    

    var span = document.createElement("span")
    span.appendChild(document.createTextNode("Name: " + targetPlanet.englishName))
    infoContainer.appendChild(span);
    
    var span = document.createElement("span")
    span.appendChild(document.createTextNode("Scientific Name: " + targetPlanet.name))
    infoContainer.appendChild(span);

    var span = document.createElement("span")
    span.appendChild(document.createTextNode("Temperature: " + targetPlanet.temperature))
    infoContainer.appendChild(span);
    
    var span = document.createElement("span")
    span.appendChild(document.createTextNode("Density: " + targetPlanet.density))
    infoContainer.appendChild(span);
    
    var span = document.createElement("span")
    span.appendChild(document.createTextNode("Radius: " + targetPlanet.radius))
    infoContainer.appendChild(span);
    
    if (targetPlanet.moons != null){
        var span = document.createElement("span")
        span.appendChild(document.createTextNode("Moons: " + targetPlanet.moons.length.toString()))
        infoContainer.appendChild(span);
    
    }
    
    document.body.appendChild(infoContainer)
}

const SolarSystemComponent = () => {
    let cancelAnimation = false;
    const [currentPlanet, setCurrentPlanet] = useState('');
    const planetsRef = useRef([]);
    const raycaster = new THREE.Raycaster();
    
    const renderData = async () => {
        const mouse = new THREE.Vector2();
        // textures
        const sunTexture = new THREE.TextureLoader().load('../textures/sun_texture.jpg')
        const space = new THREE.TextureLoader().load('../textures/space.jpg')

        // Create scene, camera, and renderer
        const scene = new THREE.Scene();
        scene.background = space;

        //scene.background = space;c
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(renderer.domElement);

        // Position the camera
        camera.position.z = 50;
        camera.position.x = -30;
        camera.position.y = 40;
        camera.lookAt(-30, 0, 0);

        // Add a simple ambient light
        const light = new THREE.AmbientLight(0xffffff, Math.PI); // soft white light
        scene.add(light);

        // Create the Sun
        const sunGeometry = new THREE.SphereGeometry(5, 32, 32);
        const sunMaterial = new THREE.MeshStandardMaterial({map: sunTexture});
        const sun = new THREE.Mesh(sunGeometry, sunMaterial);
        scene.add(sun);
        const controls = new OrbitControls(camera, renderer.domElement);
        const data = await (await fetch('/api/solar')).json();

        const planets = data.map(data => {
            // Create planet
            const geometry = new THREE.SphereGeometry(1.5, 32, 32);
            var texturePath = data['englishName'];
            var texture = new THREE.TextureLoader().load(`../textures/${texturePath}_texture.jpg`);
            const material = new THREE.MeshStandardMaterial({ map: texture });
            const planet = new THREE.Mesh(geometry, material);
            planet.userData = { distance: data.distance, speed: data.speed, angle: data.angle, name: data.name, englishName: data.englishName, radius: data.equaRadius, temperature: data.avgTemp, density: data.density, moons: data.moons };
            scene.add(planet);
            planetsRef.current.push(planet);
            
            // Create and add orbit path
            const orbit = createOrbitPath(data.distance);
            scene.add(orbit);

            return planet;
        });

        // Handle window resize
        const onWindowResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };

        const zoomInOnPlanet = (planet) => {
            const targetPosition = new THREE.Vector3(
                planet.position.x,
                planet.position.y + 5,
                planet.position.z + 5
            );
            const duration = 1000; // Duration in milliseconds

            const initialPosition = camera.position.clone();
            const initialTime = performance.now();

            const animateCamera = (time) => {
                const elapsed = time - initialTime;
                const progress = Math.min(elapsed / duration, 1);

                camera.position.lerpVectors(initialPosition, targetPosition, progress);
                camera.lookAt(planet.position)
                if (progress < 1) {
                    requestAnimationFrame(animateCamera);
                }
            };

            requestAnimationFrame(animateCamera);
        }

        // Handle mouse clicks
        const onMouseClick = (event) => {
            // Calculate mouse position in normalized device coordinates (-1 to +1) for both components
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            // Update the raycaster with the mouse position
            raycaster.setFromCamera(mouse, camera);

            // Calculate objects intersecting the picking ray
            const intersects = raycaster.intersectObjects(planetsRef.current);

            if (intersects.length > 0) {
                const targetPlanet = intersects[0].object;
                zoomInOnPlanet(targetPlanet);
                setCurrentPlanet(targetPlanet);
                updatePlanetInfo(targetPlanet.userData);
                
                cancelAnimation = true;
            }
        };

        window.addEventListener('resize', onWindowResize, false);
        window.addEventListener('click', onMouseClick, false);

        // Render loop
        const animate = () => {
            requestAnimationFrame(animate);
            
            if (cancelAnimation){
                planets.forEach(planet => {
                    planet.userData.angle += planet.userData.speed;
                    // planet.position.x = planet.userData.distance * Math.cos(planet.userData.angle);
                    // planet.position.z = planet.userData.distance * Math.sin(planet.userData.angle);
                    planet.rotation.y += 0.001;
                });
                renderer.render(scene, camera);
                return;
            }
            // Update planet positions
            planets.forEach(planet => {
                planet.userData.angle += planet.userData.speed;
                planet.position.x = planet.userData.distance * Math.cos(planet.userData.angle);
                planet.position.z = planet.userData.distance * Math.sin(planet.userData.angle);
                planet.rotation.y += 0.001;
            });

            controls.update();

            sun.rotation.y += 0.001;
            renderer.render(scene, camera);
        };

        animate();

        // Cleanup on unmount
        return () => {
            window.removeEventListener('resize', onWindowResize);
            window.removeEventListener('click', onMouseClick);
            document.body.removeChild(renderer.domElement);
        };
    };

    useEffect(() => {
        renderData();
    }, []);

    return null;
};

export default SolarSystemComponent;
