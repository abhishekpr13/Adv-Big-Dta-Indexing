import { Request,Response } from "express";
import { validatePlan } from "../models/schema";
import {plan} from "../types/resource";
import redisClient from "../config/redis";
import crypto from 'crypto';


const generateETag = (data: any): string => {
    return crypto
        .createHash('md5')
        .update(JSON.stringify(data))
        .digest('hex');
};

export const createPlan = async(req: Request, res: Response) => {
    try {
        const planData = req.body;
        
        const isValid = validatePlan(planData);
        if (!isValid) {
            return res.status(400).json({
                error: "Validation failed",
                details: validatePlan.errors
            });
        }

        const key = `plan:${planData.objectId}`;
        const existPlan = await redisClient.get(key);
        if (existPlan) {
            return res.status(409).json({
                error: "Plan with this ID already exists"
            });
        }
        const etag = generateETag(planData);
        const now = new Date().toISOString();

        const planToStore= {
            ...planData,
            etag: etag,
            lastModified: now
        };
        
        await redisClient.set(key, JSON.stringify(planToStore));
 
        res.setHeader('ETag', `"${etag}"`);  
        res.setHeader('Last-Modified', now);
        
        return res.status(201).json({
            message: "Plan created successfully",
            data: planData 
        });
    } catch(error) {
        console.error("Error creating plan:", error);
        return res.status(500).json({
            error: "Internal server error"
        });
    }
}

export const getPlan = async(req: Request, res: Response) => {
    try {
        const getId = req.params.id;
        const key = `plan:${getId}`;
        const ifModifiedSince = req.headers['if-modified-since'];
        const ifNoneMatch = req.headers['if-none-match'];
        
        const planData = await redisClient.get(key);
        
        if (!planData) {
            return res.status(404).json({
                error: "Plan not found"
            });
        }
        
        const plan = JSON.parse(planData);
        if (ifNoneMatch && plan.etag === ifNoneMatch) {
            return res.status(304).send();  
        }

        if (ifModifiedSince && plan.lastModified) {
            const lastModified = new Date(plan.lastModified);
            const sinceDate = new Date(ifModifiedSince);
            
            if (lastModified <= sinceDate) {
                return res.status(304).send(); 
            }
        }
        res.setHeader('ETag', plan.etag || '');
        res.setHeader('Last-Modified', plan.lastModified || new Date().toISOString());
        
        return res.status(200).json({
            data: plan
        });
        
    } catch(error) {
        console.error("Error getting plan:", error);
        return res.status(500).json({
            error: "Internal server error"
        });
    }
};

export const deletPlan = async(req:Request, res:Response) =>{
    try {
        const getId = req.params.id;
        const key = `plan:${getId}`;
        const planData = await redisClient.get(key);
        if (!planData) {
            return res.status(404).json({
                error: "Unable to find the ID in the database"
            })

        }
        await redisClient.del(key);
        return res.status(204).send(); 
    } catch(error){
        res.status(500).json({
            error: "Internal server Error"
        });
    }
}

export const getAllPlan = async(req:Request, res: Response)=>{
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const keys = await redisClient.keys('plan:*');
        const startIndex = (page-1)* limit;
        const endIndex = startIndex+limit
        const pageKeys = keys.slice(startIndex,endIndex)


        const plans= [];
        for (const key of pageKeys){
            const planData = await redisClient.get(key);
            if (planData){
                plans.push(JSON.parse(planData))
            }
        }
        return res.status(200).json({
        data: plans,
        pagination: {
            currentPage: page,
            itemsPerPage: limit,
            totalItems: keys.length,
            totalPages: Math.ceil(keys.length / limit),
            hasNextPage: endIndex < keys.length,
            hasPrevPage: page > 1
        }
        });
        
    }catch(error){
        res.status(500).json({
            error: "Internal server Error"
        });
    }
}
export const updatePlan = async(req: Request, res: Response) =>{
    try{
        const getId = req.params.id;
        const patchData = req.body;
        const ifMatch = req.headers['if-match'] as string;
        const key = `plan:${getId}`;
        const planData = await redisClient.get(key);
        if(!planData){
            return res.status(404).json({
                error: " User not available"
            })
        }
       const plan = JSON.parse(planData);
       const cleanIfMatch = ifMatch ? ifMatch.replace(/"/g, ''):'';
       if (!cleanIfMatch){
            return res.status(412).json({
                error: "No if-match header"
            })
       }
       if (cleanIfMatch !==plan.etag){
        return res.status(412).json({
            error: "Please get the latest version of E-tag"
        })
       }

       const mergedPlan = {
            ...plan,
            ...patchData,
            planCostShares: patchData.planCostShares
            ?{
                ...plan.planCostShares,
                ...patchData.planCostShares
            }
            : plan.planCostShares,
            linkedPlanServices : patchData.linkedPlanServices || plan.linkedPlanServices
       };
       const { etag: oldEtag, lastModified: oldModified, ...planToValidate } = mergedPlan;
       const isValid = validatePlan(planToValidate);
       if (!isValid){
            return res.status(400).json({
                error: "Merge plan failed to validate",
                details: validatePlan.errors
            })
        }

        const newEtag = generateETag(planToValidate);
        const updatePlan = {
            ...planToValidate,
            etag: newEtag, 
            lastModified: new Date().toISOString()
        }
        await redisClient.set(key, JSON.stringify(updatePlan));
        res.setHeader('ETag', `"${newEtag}"`);
        res.setHeader('Last-Modified', updatePlan.lastModified);
        
        return res.status(200).json({
            message: "Plan updated successfully",
            data: planToValidate
            
        });


    } catch(error){
        return res.status(500).json({
            error: "Internal server error"
        })
    }
}