import Ajv from "ajv";

const ajv = new Ajv({ allErrors: true });

export const PlanSchema = {
    type: "object",
    required: ["planCostShares", "linkedPlanServices", "_org", "objectId", "objectType", "planType", "creationDate"],
    properties: {
        planCostShares: {
            type: "object",
            required: ["deductible", "_org", "copay", "objectId", "objectType"],
            properties: {
                deductible: { type: "number", minimum: 0 },
                _org: { type: "string" },
                copay: { type: "number", minimum: 0 },
                objectId: { type: "string" },
                objectType: { const: "membercostshare" }
            }
        },
        linkedPlanServices: {
            type: "array",  
            items: { 
                type: "object",
                required: ["linkedService", "planserviceCostShares", "_org", "objectId", "objectType"],
                properties: {
                    linkedService: {
                        type: "object",
                        required: ["_org", "objectId", "objectType", "name"],
                        properties: {
                            _org: { type: "string" },
                            objectId: { type: "string" },
                            objectType: { const: "service" },
                            name: { type: "string" }
                        }
                    },
                    planserviceCostShares: {
                        type: "object",
                        required: ["deductible", "_org", "copay", "objectId", "objectType"],
                        properties: {
                            deductible: { type: "number", minimum: 0 },
                            _org: { type: "string" },
                            copay: { type: "number", minimum: 0 },
                            objectId: { type: "string" },
                            objectType: { const: "membercostshare" }
                        }
                    },
                    _org: { type: "string" },
                    objectId: { type: "string" },
                    objectType: { const: "planservice" }
                }
            }
        },
        _org: { type: "string" },
        objectId: { type: "string" },
        objectType: { const: "plan" },
        planType: { type: "string", enum: ["inNetwork", "outNetwork"] },
        creationDate: { type: "string", pattern: "^\\d{2}-\\d{2}-\\d{4}$" }
    }
};

export const validatePlan = ajv.compile(PlanSchema);