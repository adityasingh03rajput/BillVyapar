import mongoose from 'mongoose';
import { BusinessProfile } from '../models/BusinessProfile.js';

export async function requireProfile(req, res, next) {
  try {
    const profileIdHeader = req.header('X-Profile-ID');
    if (!profileIdHeader) {
      return res.status(400).json({ error: 'X-Profile-ID header is required' });
    }

    if (!mongoose.Types.ObjectId.isValid(profileIdHeader)) {
      return res.status(400).json({ error: 'Invalid X-Profile-ID' });
    }

    const profile = await BusinessProfile.findOne({ _id: profileIdHeader, userId: req.userId });
    if (!profile) {
      return res.status(404).json({ error: 'Business profile not found' });
    }

    req.profileId = profile._id;
    next();
  } catch (err) {
    next(err);
  }
}
