// mapStateManager.js
export const mapStateManager = {
    state: {
        map: null,
        tempMarker: null,
        isAddingTask: false,
        markers: [],
        technicians: [],
        unassignedTasks: [],
        assignedTasks: [],
        inTransitTasks: [],
        succeededTasks: [],
        failedTasks: []
    },

    setMap(map) {
        console.log('Setting map:', map);
        if (!map) {
            console.warn('Attempting to set null map');
            return;
        }
        this.state.map = map;
        console.log('Map set successfully');
    },

    resetState() {
        console.log('Resetting map state');
        this.state = {
            map: this.state.map,
            tempMarker: null,
            isAddingTask: false,
            markers: [],
            technicians: [],
            unassignedTasks: [],
            assignedTasks: [],
            inTransitTasks: [],
            succeededTasks: [],
            failedTasks: []
        };
    },

    updateTechnicians(technicians) {
        this.state.technicians = technicians || [];
    },

    updateUnassignedTasks(tasks) {
        this.state.unassignedTasks = tasks || [];
    },

    updateAssignedTasks(tasks) {
        this.state.assignedTasks = tasks || [];
    },

    updateInTransitTasks(tasks) {
        this.state.inTransitTasks = tasks || [];
    },

    updateSucceededTasks(tasks) {
        this.state.succeededTasks = tasks || [];
    },

    updateFailedTasks(tasks) {
        this.state.failedTasks = tasks || [];
    },

    setTempMarker(marker) {
        if (this.state.tempMarker) {
            this.state.map.removeLayer(this.state.tempMarker);
        }
        this.state.tempMarker = marker;
    },

    toggleAddingTask() {
        this.state.isAddingTask = !this.state.isAddingTask;
    },

    addMarker(marker) {
        this.state.markers.push(marker);
    },

    clearMarkers() {
        this.state.markers.forEach(marker => marker.remove());
        this.state.markers = [];
    }
};