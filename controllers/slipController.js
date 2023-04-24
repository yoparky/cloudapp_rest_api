'use strict';

const { Datastore } = require('@google-cloud/datastore');
const helpers = require('./helpers');

const datastore = new Datastore({
    projectId: 'a3-rest-api',
  });
const SLIP = "Slip";

// Begin slip Model Functions
function post_slip(number) {
    var key = datastore.key(SLIP);
    const new_slip = {
        "number": number,
        "current_boat": null
    }
    return datastore.save({
        "key": key,
        "data": new_slip
    }).then(() => { return key });
}

function get_slip(id) {
    const key = helpers.getKey(datastore, SLIP, id);
    return datastore.get(key).then(entity => {
        if (entity[0] === undefined || entity[0] === null) {
            return entity;
        } else {
            return entity.map(helpers.fromDatastore);
        }
    });
}

function get_slips() {
    const query = datastore.createQuery(SLIP);
    return datastore.runQuery(query).then(entities => {
        // id attribute added to all entities[0]
        return entities[0].map(helpers.fromDatastore);
    }).catch(err => {
        console.error('Error retrieving slips:', err);
    });
}

function delete_slip(id) {
    const key = helpers.getKey(datastore, SLIP, id);
    return datastore.delete(key);
}

function put_boat_at_slip(slip_id, boat_id) {
    const slip_key = helpers.getKey(datastore, SLIP, slip_id);
    return datastore.get(slip_key).then(entity => {
        if (entity[0] === undefined || entity[0] === null) {
            return entity;
        } else {
            // Check this part
            if (entity[0].current_boat === null) {
                // slip empty
                entity[0].current_boat = boat_id;
                const data = {
                    key: slip_key,
                    data: entity[0]
                };
                return datastore.upsert(data);
                
            }
            // slip full
            return entity;
        }
    });
}

function delete_boat_leave_slip(slip_id, boat_id) {
    const slip_key = helpers.getKey(datastore, SLIP, slip_id);
    return datastore.get(slip_key).then(entity => {
        if (entity[0] === undefined || entity[0] === null) {
            return entity;
        } else {
            // Check this part
            if (entity[0].current_boat === boat_id) {
                // slip empty
                entity[0].current_boat = null;
                const data = {
                    key: slip_key,
                    data: entity[0]
                };
                return datastore.upsert(data);
            }
            // slip mismatch
            return entity;
        }
    });
}

module.exports = {
    post_slip,
    get_slip,
    get_slips,
    delete_slip,
    put_boat_at_slip,
    delete_boat_leave_slip
}