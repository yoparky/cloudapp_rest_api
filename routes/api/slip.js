'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const boatController = require('../../controllers/boatController');
const slipController = require('../../controllers/slipController');

const app = express();
app.use(bodyParser.json());
const router = express.Router();

router.post('/', function (req, res) {
    if (req.body.hasOwnProperty('number')) {
        var number = req.body.number;
        slipController.post_slip(number)
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

router.get('/:slip_id', function (req, res) {
    slipController.get_slip(req.params.slip_id)
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

router.get('/', function (req, res) {
    const slips = slipController.get_slips()
        .then((slips) => {
            res.status(200).json(slips);
        });
});

router.delete('/:slip_id', function (req, res) {
    slipController.get_slip(req.params.slip_id)
        .then(slip => {
            if (slip[0] === undefined || slip[0] === null) {
                // no slip with id
                res.status(404).json({"Error": "No slip with this slip_id exists"});
            } else {
                // found slip with id
                slipController.delete_slip(req.params.slip_id)
                    .then(res.status(204).end());
            }
        })
});

router.put('/:slip_id/:boat_id', function (req, res) {
    boatController.get_boat(req.params.boat_id)
        .then(boat => {
            if (boat[0] === undefined || boat[0] === null) {
                // no boat with id
                res.status(404).json({"Error": "The specified boat and/or slip does not exist"});
            } else {
                // found boat with id
                slipController.get_slip(req.params.slip_id)
                    .then(slip => {
                        if (slip[0] === undefined || slip[0] === null) {
                            // no slip with id
                            res.status(404).json({"Error": "The specified boat and/or slip does not exist"});
                        } else {
                            // found the slip with id
                            if (slip[0].current_boat === null) {
                                slipController.put_boat_at_slip(req.params.slip_id, req.params.boat_id)
                                    .then(() => res.status(204).end());
                            } else {
                                res.status(403).json({"Error": "The slip is not empty"});
                            }
                        }
                    })
            }
        })
});

router.delete('/:slip_id/:boat_id', function (req, res) {
    boatController.get_boat(req.params.boat_id)
        .then(boat => {
            if (boat[0] === undefined || boat[0] === null) {
                // no boat with id
                res.status(404).json({"Error": "No boat with this boat_id is at the slip with this slip_id"});
            } else {
                // found boat with id
                slipController.get_slip(req.params.slip_id)
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
                                slipController.delete_boat_leave_slip(req.params.slip_id, req.params.boat_id)
                                    .then(() => res.status(204).end());
                            }
                        }
                    })
            }
        })
});

module.exports = router;