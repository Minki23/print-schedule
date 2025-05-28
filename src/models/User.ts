import { Schema, model, models } from 'mongoose';

const UserSchema = new Schema({
    id: {
        type: String,
        unique: true,
        required: [true, 'ID is required'],
    },
    email: {
        type: String,
        unique: true,
        required: [true, 'Email is required'],
        match: [/^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/, 'Invalid email format']
    },
    name: {
        type: String,
        required: [true, 'Name is required'],
        minLength: [3, 'Name must be at least 3 characters'],
        maxLength: [50, 'Name must be at most 50 characters']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        select: false
    },
    rank: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    }
});

const User = models.User || model('User', UserSchema);

export default User;
