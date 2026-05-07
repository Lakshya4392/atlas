import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import bcrypt from 'bcryptjs';

export interface IUser extends Model {
  id: string;
  email: string;
  password: string;
  name: string;
  avatar?: string;
  bio?: string;
  stylePreferences: string[];
  wardrobeStats: {
    totalItems: number;
    totalOutfits: number;
    favoriteItems: number;
    currentStreak: number;
    longestStreak: number;
  };
  settings: {
    notifications: boolean;
    weatherSuggestions: boolean;
    aiSuggestions: boolean;
    theme: 'light' | 'dark' | 'system';
    language: string;
  };
  lastActive: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  updateLastActive(): Promise<void>;
}

const User = sequelize.define<IUser>('User', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
      notEmpty: true
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      len: [6, 255]
    }
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 50]
    }
  },
  avatar: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: [0, 500]
    }
  },
  stylePreferences: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
    validate: {
      isValidPreferences(value: string[]) {
        const validPrefs = ['Smart Casual', 'Minimalist', 'Streetwear', 'Classic', 'Bohemian', 'Athleisure', 'Business', 'Evening', 'Casual'];
        if (!Array.isArray(value)) throw new Error('Style preferences must be an array');
        for (const pref of value) {
          if (!validPrefs.includes(pref)) {
            throw new Error(`Invalid style preference: ${pref}`);
          }
        }
      }
    }
  },
  wardrobeStats: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {
      totalItems: 0,
      totalOutfits: 0,
      favoriteItems: 0,
      currentStreak: 0,
      longestStreak: 0
    }
  },
  settings: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {
      notifications: true,
      weatherSuggestions: true,
      aiSuggestions: true,
      theme: 'system',
      language: 'en'
    }
  },
  lastActive: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: true,
  indexes: [
    { unique: true, fields: ['email'] },
    { fields: ['lastActive'] }
  ]
});

// Hash password before saving
User.beforeCreate(async (user) => {
  if (user.password) {
    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(user.password, salt);
  }
});

User.beforeUpdate(async (user) => {
  if (user.changed('password')) {
    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(user.password, salt);
  }
});

// Instance methods
User.prototype.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

User.prototype.updateLastActive = async function(): Promise<void> {
  this.lastActive = new Date();
  await this.save();
};

export default User;