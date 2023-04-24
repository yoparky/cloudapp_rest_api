'use strict';

const { Datastore } = require('@google-cloud/datastore');

// helper to set item id from datastore
function fromDatastore(item) {
    item.id = item[Datastore.KEY].id;
    return item;
}

// on delete cascade helper
function cascadeDelete(datastore, entity, property_name, id, kind) {
    for(var i = 0; i < entity.length; i++) {
        if (entity[i].hasOwnProperty(property_name) && entity[i][property_name] === id) {
            entity[i][property_name] = null;
            const kind_cascaded_key = getKey(datastore, kind, entity[i].id);
            var e = datastore.get(kind_cascaded_key);
            const data = {
                key: kind_cascaded_key,
                data: entity[i]
            }
            datastore.upsert(data);
        }
    }
}

// helper to get key from datastore
function getKey(datastore, kind, id) {
    return datastore.key([kind, parseInt(id, 10)]);
}


module.exports = {
    fromDatastore,
    cascadeDelete
}