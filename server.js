'use strict';

const express = require('express');
const app = express();

const { Datastore } = require('@google-cloud/datastore');
const bodyParser = require('body-parser');

const datastore = new Datastore();

const BOAT = "Boat";
const SLIP = "Slip";

const router = express.Router();

app.use(bodyParser.json());

// helpers
// helper to set item id from datastore
function fromDatastore(item) {
    item.id = item[Datastore.KEY].id;
    return item;
}
// helper to get key from datastore
function getKey(kind, id) {
    return datastore.key([kind, parseInt(id, 10)]);
}
// on delete cascade helper
function cascadeDelete(entity, property_name, id, kind) {
    for(var i = 0; i < entity.length; i++) {
        if (entity[i].hasOwnProperty(property_name) && entity[i][property_name] === id) {
            entity[i][property_name] = null;
            const kind_cascaded_key = getKey(kind, entity[i].id);
            var e = datastore.get(kind_cascaded_key);
            const data = {
                key: kind_cascaded_key,
                data: entity[i]
            }
            datastore.upsert(data);
        }
    }
}

// Begin boat Model Functions
function get_boats() {
    const query = datastore.createQuery(BOAT);
    return datastore.runQuery(query).then(entities => {
        // id attribute added to all entities[0]
        return entities[0].map(fromDatastore);
    }).catch(err => {
        console.error('Error retrieving boats:', err);
    });
}

function get_boat(id) {
    const key = getKey(BOAT, id);
    return datastore.get(key).then(entity => {
        if (entity[0] === undefined || entity[0] === null) {
            return entity;
        } else {
            return entity.map(fromDatastore);
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
    const key = getKey(BOAT, id);
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
        var new_entities = entities[0].map(fromDatastore)
        return cascadeDelete(new_entities, "current_boat", id, SLIP);
    });

    // delete
    const key = getKey(BOAT, id);
    return datastore.delete(key);
}

// Begin boat Model Functions
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
    const key = getKey(SLIP, id);
    return datastore.get(key).then(entity => {
        if (entity[0] === undefined || entity[0] === null) {
            return entity;
        } else {
            return entity.map(fromDatastore);
        }
    });
}

function get_slips() {
    const query = datastore.createQuery(SLIP);
    return datastore.runQuery(query).then(entities => {
        // id attribute added to all entities[0]
        return entities[0].map(fromDatastore);
    }).catch(err => {
        console.error('Error retrieving slips:', err);
    });
}

function delete_slip(id) {
    const key = getKey(SLIP, id);
    return datastore.delete(key);
}

function put_boat_at_slip(slip_id, boat_id) {
    const slip_key = getKey(SLIP, slip_id);
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
    const slip_key = getKey(SLIP, slip_id);
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


// Controller Functions
router.post('/boats', function (req, res) {
    if (req.body.hasOwnProperty('name') && req.body.hasOwnProperty('type') && req.body.hasOwnProperty('length')) {
        var name = req.body.name;
        var type = req.body.type;
        var length = req.body.length;
        post_boat(name, type, length)
            .then(key => {
                res.status(201).json(
                    {
                        "id": key.id,
                        "name": name,
                        "type": type,
                        "length": length,
                    }
                )
            });
    } else {
        res.status(400).json({"Error": "The request object is missing at least one of the required attributes"});
    }
});

router.get('/boats/:boat_id', function (req, res) {
        get_boat(req.params.boat_id)
        .then(boat => {
            if (boat[0] === undefined || boat[0] === null) {
                // no boat with id
                res.status(404).json({"Error": "No boat with this boat_id exists"});
            } else {
                // found boat with id
                res.status(200).json(boat[0]);
            }
        })
});

router.get('/boats', function (req, res) {
    const boats = get_boats()
        .then((boats) => {
            res.status(200).json(boats);
        });
});

router.patch('/boats/:boat_id', function (req, res) {
    get_boat(req.params.boat_id)
        .then(boat => {
            if (boat[0] === undefined || boat[0] === null) {
                // no boat with id
                res.status(404).json({"Error": "No boat with this boat_id exists"});
            } else {
                // found boat with id
                if (req.body.hasOwnProperty('name') && req.body.hasOwnProperty('type') && req.body.hasOwnProperty('length')) {
                    var name = req.body.name;
                    var type = req.body.type;
                    var length = req.body.length;
                    patch_boat(req.params.boat_id, name, type, length)
                        .then(key => {
                            res.status(200).json(
                                {
                                    "id": key.id,
                                    "name": name,
                                    "type": type,
                                    "length": length,
                                }
                            )
                        });
                } else {
                    res.status(400).json({"Error": "The request object is missing at least one of the required attributes"});
                }
            }
        })
});

router.delete('/boats/:boat_id', function (req, res) {
    get_boat(req.params.boat_id)
        .then(boat => {
            if (boat[0] === undefined || boat[0] === null) {
                // no boat with id
                res.status(404).json({"Error": "No boat with this boat_id exists"});
            } else {
                // found boat with id
                delete_boat(req.params.boat_id)
                    .then(res.status(204).end());
            }
        })
});



router.post('/slips', function (req, res) {
    if (req.body.hasOwnProperty('number')) {
        var number = req.body.number;
        post_slip(number)
            .then(key => {
                // consider doing a get and returning a json of the actual db status
                res.status(201).json(
                    {
                        "id": key.id,
                        "number": number,
                        "current_boat": null,
                    }
                )
            });
    } else {
        res.status(400).json({"Error": "The request object is missing the required number"});
    }
});

router.get('/slips/:slip_id', function (req, res) {
    get_slip(req.params.slip_id)
        .then(slip => {
            if (slip[0] === undefined || slip[0] === null) {
                // no slip with id
                res.status(404).json({"Error": "No slip with this slip_id exists"});
            } else {
                // found slip with id
                res.status(200).json(slip[0]);
            }
        })
});

router.get('/slips', function (req, res) {
    const slips = get_slips()
        .then((slips) => {
            res.status(200).json(slips);
        });
});

router.delete('/slips/:slip_id', function (req, res) {
    get_slip(req.params.slip_id)
        .then(slip => {
            if (slip[0] === undefined || slip[0] === null) {
                // no slip with id
                res.status(404).json({"Error": "No slip with this slip_id exists"});
            } else {
                // found slip with id
                delete_slip(req.params.slip_id)
                    .then(res.status(204).end());
            }
        })
});

router.put('/slips/:slip_id/:boat_id', function (req, res) {
    get_boat(req.params.boat_id)
                    .then(boat => {
                        if (boat[0] === undefined || boat[0] === null) {
                            // no boat with id
                            res.status(404).json({"Error": "The specified boat and/or slip does not exist"});
                        } else {
                            // found boat with id
                            get_slip(req.params.slip_id)
                                .then(slip => {
                                    if (slip[0] === undefined || slip[0] === null) {
                                        // no slip with id
                                        res.status(404).json({"Error": "The specified boat and/or slip does not exist"});
                                    } else {
                                        // found the slip with id
                                        if (slip[0].current_boat === null) {
                                            put_boat_at_slip(req.params.slip_id, req.params.boat_id)
                                                .then(() => res.status(204).end());
                                        } else {
                                            res.status(403).json({"Error": "The slip is not empty"});
                                        }
                                    }
                                })
                        }
                    })
});

router.delete('/slips/:slip_id/:boat_id', function (req, res) {
    get_boat(req.params.boat_id)
                    .then(boat => {
                        if (boat[0] === undefined || boat[0] === null) {
                            // no boat with id
                            res.status(404).json({"Error": "No boat with this boat_id is at the slip with this slip_id"});
                        } else {
                            // found boat with id
                            get_slip(req.params.slip_id)
                                .then(slip => {
                                    if (slip[0] === undefined || slip[0] === null) {
                                        // no slip with id
                                        res.status(404).json({"Error": "No boat with this boat_id is at the slip with this slip_id"});
                                    } else {
                                        // found the slip with id
                                        if (slip[0].current_boat !== req.params.boat_id) {
                                            res.status(404).json({"Error": "No boat with this boat_id is at the slip with this slip_id"});
                                            // put_boat_at_slip(req.params.slip_id, req.params.boat_id)
                                            //     .then(() => res.status(204).end());
                                        } else {
                                            // res.status(403).json({"Error": "The slip is not empty"});
                                            delete_boat_leave_slip(req.params.slip_id, req.params.boat_id)
                                                .then(() => res.status(204).end());
                                        }
                                    }
                                })
                        }
                    })
});


app.use('/', router);

// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}...`);
});