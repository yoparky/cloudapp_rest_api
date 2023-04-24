'use strict';

const { Datastore } = require('@google-cloud/datastore');
const helpers = require('./helpers');

const datastore = new Datastore({
    projectId: 'cs493-assignment3',
  });
const BOAT = "Boat";
const SLIP = "Slip";

function get_boats() {
    const query = datastore.createQuery(BOAT);
    return datastore.runQuery(query).then(entities => {
        // id attribute added to all entities[0]
        return entities[0].map(helpers.fromDatastore);
    }).catch(err => {
        console.error('Error retrieving boats:', err);
    });
}

function get_boat(id) {
    const key = helpers.getKey(datastore, BOAT, id);
    return datastore.get(key).then(entity => {
        if (entity[0] === undefined || entity[0] === null) {
            return entity;
        } else {
            return entity.map(helpers.fromDatastore);
        }
    });
}

function post_boat(name, type, length) {
    var key = datastore.key(BOAT);
    const new_boat = {
        "name": name,
        "type": type,
        "length": length
    }
    return datastore.save({
        "key": key,
        "data": new_boat
    }).then(() => { return key });
}

function patch_boat(id, name, type, length) {
    const key = helpers.getKey(datastore, BOAT, id);
    const edit_boat = {
        "name": name,
        "type": type,
        "length": length
    }
    return datastore.save({
        "key": key,
        "data": edit_boat
    });
}

function delete_boat(id) {
    // cascade delete to slips
    const query = datastore.createQuery(SLIP);
    datastore.runQuery(query).then(entities => {
        // id attribute added to all entities[0]
        var new_entities = entities[0].map(helpers.fromDatastore)
        return helpers.cascadeDelete(datastore, new_entities, "current_boat", id, SLIP);
    });

    // delete
    const key = helpers.getKey(datastore, BOAT, id);
    return datastore.delete(key);
}

module.exports = {
    get_boats,
    get_boat,
    post_boat,
    patch_boat,
    delete_boat
}