'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const boatController = require('../../controllers/boatController');

const app = express();
app.use(bodyParser.json());
const router = express.Router();

router.post('/', function (req, res) {
    if (req.body.hasOwnProperty('name') && req.body.hasOwnProperty('type') && req.body.hasOwnProperty('length')) {
        var name = req.body.name;
        var type = req.body.type;
        var length = req.body.length;
        boatController.post_boat(name, type, length)
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

router.get('/:boat_id', function (req, res) {
        boatController.get_boat(req.params.boat_id)
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

router.get('/', function (req, res) {
    const boats = boatController.get_boats()
        .then((boats) => {
            res.status(200).json(boats);
        });
});

router.patch('/:boat_id', function (req, res) {
    boatController.get_boat(req.params.boat_id)
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
                    boatController.patch_boat(req.params.boat_id, name, type, length)
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

router.delete('/:boat_id', function (req, res) {
    boatController.get_boat(req.params.boat_id)
        .then(boat => {
            if (boat[0] === undefined || boat[0] === null) {
                // no boat with id
                res.status(404).json({"Error": "No boat with this boat_id exists"});
            } else {
                // found boat with id
                boatController.delete_boat(req.params.boat_id)
                    .then(res.status(204).end());
            }
        })
});

module.exports = router;