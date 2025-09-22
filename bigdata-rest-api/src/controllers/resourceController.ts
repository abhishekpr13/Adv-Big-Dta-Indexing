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

        const planToStore = {
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