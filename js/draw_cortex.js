import * as THREE from 'three';
import { Vector3 } from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils';
import { scene, transformControls,
    mouseButtonIsDown,
    cortexMeshUrl,
    innerSkullMeshUrl,
    scalpMeshUrl,
     GLOBAL_LAYER } from "../public/main.js";
import { guiParams } from './setup_gui';
import { deleteMesh } from './mesh_helper.js';
import { loadGltfModel } from './load_data.js';

let extraItemMesh;

let initExtraItemPosition = new Vector3(0,-13,0);
let initExtraItemRotation = new Vector3(0,0,0);
let initExtraItemScale = new Vector3(.8,.8,.8);

let transformControlHistory = [];
let transformControlHistoryToken;

let transformControlsEnabled = false;

const cortexMaterial = new THREE.MeshStandardMaterial({
    color: '#ffc0cb',
    opacity: 0.5,      // Set opacity level (0 = fully transparent, 1 = fully opaque)
    transparent: true, // Enable transparency
    side: THREE.DoubleSide,
    flatShading: false
});

function loadAndDrawCortexModel(){
    removeExtraItemMesh();
    loadCortexModel()
        .then((response) => drawExtraItemModel(response));
}

function drawExtraItemModelWithOffset(geometry, newPosition) {
    console.log('Drawing model with offset:', newPosition);
    
    if (!geometry) {
        console.error('ERROR: Geometry is null or undefined.');
        return;
    }

    let position = newPosition;  // Use the provided offset position
    let rotation = initExtraItemRotation;
    let scale = initExtraItemScale;

    console.log("222 position:", position);
    console.log("222 rotation:", rotation);
    console.log("222 scale:", scale);

    const extraItemMesh = new THREE.Mesh(geometry, cortexMaterial);
    extraItemMesh.geometry.computeVertexNormals();

    // Apply the new position
    extraItemMesh.position.set(position.x, position.y, position.z);
    extraItemMesh.rotation.set(rotation.x, rotation.y, rotation.z);
    extraItemMesh.scale.set(scale.x, scale.y, scale.z);
    
    scene.add(extraItemMesh);
    console.log("Added second cortex model at:", extraItemMesh.position);
}


function loadAndDrawCortexDualModel() {
    loadCortexModel()
        .then((geometry) => {
            console.log("Drawing first cortex model");
            // Rotate the first brain 180 degrees so it faces left
            const firstGeometry = geometry.clone();
            firstGeometry.rotateY(Math.PI);
            drawExtraItemModel(firstGeometry); // First model at the default position
        });

    loadCortexModel()
        .then((geometry) => {
            console.log("Drawing second cortex model at a new position");
            const clonedGeometry = geometry.clone();

            // Move second brain to the left
            const offsetPosition = new Vector3(initExtraItemPosition.x - 200, initExtraItemPosition.y, initExtraItemPosition.z);
            // Keep the second brain's original orientation (facing right)
            // No rotation needed here
            drawExtraItemModelWithOffset(clonedGeometry, offsetPosition);
        });
}

function drawExtraItemInnerSkullModel(){
    loadInnerSkullModel().then((response) => drawExtraItemModel(response));
}

function loadAndDrawScalpModel(){
    loadScalpModel().then((response) => drawExtraItemModel(response));
}

function drawExtraItemSphereModel(){
    const geometry = new THREE.SphereGeometry( 32, 32, 16 );
    drawExtraItemModel(geometry);
}

function drawExtraItemCubeModel(){
    const geometry = new THREE.BoxGeometry( 40, 40, 40 );
    drawExtraItemModel(geometry);
}

function loadCortexModel(){
    return loadGltfModel(cortexMeshUrl, 'cortex model',
        (gltf) => {
            const hemi0Mesh = gltf.scene.children[0].children[0];
            const hemi1Mesh = gltf.scene.children[0].children[1];
            return BufferGeometryUtils.mergeGeometries([hemi0Mesh.geometry, hemi1Mesh.geometry]);
    });
}

function loadInnerSkullModel(){
    return loadGltfModel(innerSkullMeshUrl, 'inner skull model');
}

function loadScalpModel(){
    return loadGltfModel(scalpMeshUrl, 'Scalp model');
}

function drawExtraItemModel(geometry) {
    
    console.log('geometry', geometry);
    
    let position = initExtraItemPosition;
    let rotation = initExtraItemRotation;
    let scale = initExtraItemScale;

    
    if (extraItemMesh){
        position = extraItemMesh.position.clone();
        rotation = extraItemMesh.rotation.clone();
        scale = extraItemMesh.scale.clone();
        removeExtraItemMesh();
    }

    console.log("444 position:", position);
    console.log("444 rotation:", rotation);
    console.log("444 scale:", scale);

    extraItemMesh = new THREE.Mesh( geometry, cortexMaterial );
    extraItemMesh.geometry.computeVertexNormals();
    updateExtraItemMeshVisibility();

    initNewExtraItemShape(position, rotation, scale);
    scene.add(extraItemMesh);
}

function resetPositionExtraItemMesh(){
    transformControlHistory.push({
        position: extraItemMesh.position.clone(),
        rotation: extraItemMesh.rotation.clone(),
        scale: extraItemMesh.scale.clone()
    });
    repositionExtraItemMesh(initExtraItemPosition, initExtraItemRotation, initExtraItemScale);
}

function initNewExtraItemShape(position, rotation, scale){
    extraItemMesh.receiveShadow = true;
    extraItemMesh.castShadow = true;
    repositionExtraItemMesh(position, rotation, scale);
}

function repositionExtraItemMesh(position, rotation, scale){
    extraItemMesh.position.set(position.x, position.y, position.z);
    extraItemMesh.rotation.set(rotation.x, rotation.y, rotation.z);
    extraItemMesh.scale.set(scale.x, scale.y, scale.z);
}

function updateExtraItemMeshVisibility(){
    extraItemMesh.visible = guiParams.showExtraItem;
    if(guiParams.showExtraItem) {extraItemMesh.layers.enable(GLOBAL_LAYER)}
    else {extraItemMesh.layers.disable(GLOBAL_LAYER)};
}

function hideExtraItem(){
    guiParams.showExtraItem = false;
    updateExtraItemMeshVisibility();
}

function showExtraItem(){
    guiParams.showExtraItem = true;
    updateExtraItemMeshVisibility();
}

function removeExtraItemMesh(){
    if (extraItemMesh){
        deleteMesh(extraItemMesh);
        extraItemMesh = null;
    }
}

function updateExtraItemMaterial(){
    if (extraItemMesh){
        extraItemMesh.material.color = new THREE.Color(guiParams.colorExtraItem);
    }
}

function updateExtraItemMesh(){
    showExtraItem();
    disableTransformControls();
    if (guiParams.extraItemMeshShape == 'brain'){
        loadAndDrawCortexModel();
    }
    if (guiParams.extraItemMeshShape == 'innerSkull'){
        drawExtraItemInnerSkullModel();
    }
    if (guiParams.extraItemMeshShape == 'scalp'){
        loadAndDrawScalpModel();
    }
    if (guiParams.extraItemMeshShape == 'sphere'){
        drawExtraItemSphereModel();
    }
    if (guiParams.extraItemMeshShape == 'cube'){
        drawExtraItemCubeModel();
    }
    if (guiParams.extraItemMeshShape == 'dualBrain') {
        loadAndDrawCortexDualModel();
    }
}

function toggleTransformControls(mode){
    if (!extraItemMesh){return;}
    if (!transformControlsEnabled){
        transformControls.attach( extraItemMesh );
        transformControlsEnabled = true;
    }
    else if ( transformControls.mode == mode){
        disableTransformControls();
    }
    transformControls.setMode(mode);
}

function disableTransformControls(){
    if (transformControlsEnabled){
        transformControls.detach( extraItemMesh );
        transformControlsEnabled = false;
    }
}

function translateModeTransformControls(){
    toggleTransformControls('translate');
}
function rotateModeTransformControls(){
    toggleTransformControls('rotate');
}
function scaleModeTransformControls(){
    toggleTransformControls('scale');
}

function handleTransformControlChangeEvent(event){
    if (mouseButtonIsDown && transformControlHistoryToken == null){
        transformControlHistoryToken = {
            position: extraItemMesh.position.clone(),
            rotation: extraItemMesh.rotation.clone(),
            scale: extraItemMesh.scale.clone()
        };
    }
}

function updateTransformControlHistory(){
    if (transformControlHistoryToken){
        transformControlHistory.push(transformControlHistoryToken);
        transformControlHistoryToken = null;
      }
}

function undoTransformControls(){
    if (transformControlHistory.length == 0){ return; }
    const previousTransfo = transformControlHistory.pop();
    repositionExtraItemMesh(previousTransfo.position, previousTransfo.rotation, previousTransfo.scale);
}

export {
    loadAndDrawCortexModel,
    loadAndDrawCortexDualModel,
    drawExtraItemSphereModel,
    updateExtraItemMeshVisibility as updateBrainMeshVisibility,
    hideExtraItem,
    showExtraItem,
    updateExtraItemMaterial,
    updateExtraItemMesh,
    translateModeTransformControls,
    rotateModeTransformControls,
    scaleModeTransformControls,
    resetPositionExtraItemMesh,
    disableTransformControls,
    handleTransformControlChangeEvent,
    updateTransformControlHistory,
    undoTransformControls
};