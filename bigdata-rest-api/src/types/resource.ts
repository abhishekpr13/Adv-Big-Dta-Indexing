export interface MemberCostShare {
    deductible: number;
    _org: string;
    copay: number;
    objectId: string;
    objectType: "membercostshare"
}

export interface Service {
    _org: string;
    objectId: string;
    objectType: "service";
    name: string
}

export interface PlanService {
    linkedService: Service;
    planserviceCostShares: MemberCostShare;
    _org: string;
    objectId: string;
    objectType: "planservice";
}

export interface plan {
    planCostShares: MemberCostShare;
    linkedPlanServices: PlanService[];
    _org: String;
    objectId: string;
    objectType: "plan";
    planType: string;
    creationDate: string;
}

declare global {
    namespace Express {
        interface Request {
            user?: {
                email?: string;
                name?: string;
                googleId?: string;
            }
        }
    }
}