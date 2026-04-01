import {
  createJarAllocation,
  deleteJarAllocation,
  listJarAllocations,
  updateJarAllocation
} from '../services/jarAllocationService.js';

export const getJarAllocations = async (req, res, next) => {
  try {
    const result = await listJarAllocations();
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const postJarAllocation = async (req, res, next) => {
  try {
    const result = await createJarAllocation(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const putJarAllocation = async (req, res, next) => {
  try {
    const result = await updateJarAllocation(req.params.id, req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const removeJarAllocation = async (req, res, next) => {
  try {
    const result = await deleteJarAllocation(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
