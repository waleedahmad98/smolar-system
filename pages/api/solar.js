import moment from "moment";
export default async function handler(req, res) {
    var planetData = await (await fetch("https://api.le-systeme-solaire.net/rest/bodies/")).json();
    planetData = planetData['bodies'];
    // Organize planets
    // only get planets
    let today = moment();

    planetData = planetData.filter(planet => {
        if (planet['isPlanet'] == true){
            return planet;
        }
    });

    // find closest and farthest planet
    var min = Number.MAX_SAFE_INTEGER;
    var max = Number.MIN_SAFE_INTEGER;

    planetData = planetData.sort((a, b) => (a['perihelion'] > b['perihelion'] ? 1 : -1))

    planetData.forEach(planet => {
        if (planet['perihelion'] < min){
            min = planet['perihelion']
        }
        if (planet['perihelion'] > max){
            max = planet['perihelion']
        }
    });

    planetData.map(planet => {
        planet['distance'] = calculateDistance(min, max, 15, 60, planet['perihelion']);
        planet['speed'] = 365 / 3650000;

        planet['angle'] = ((today % planet['sideralOrbit']) / planet['sideralOrbit']) * 360
        return planet;
    })

    for(let i=1; i<planetData.length; i++){
        planetData[i].distance = planetData[i-1].distance + 3;
    }
    

    // const planetData = [
    //         { name: "mercury", texturePath: 0xff0000, distance: 10, speed: 0.01, revolutionSpeed: 0.01 } // planet 1
    //     ];
    res.status(200).json(planetData);
}

const calculateDistance = (min, max, nMin, nMax, current) => {
    return ((current - min) / (max - min)) * (nMax - nMin) + nMin;
}