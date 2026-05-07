import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import User from './User';
import ClothingItem from './ClothingItem';

export interface IOutfit extends Model {
  id: string;
  userId: string;
  name: string;
  description?: string;
  occasion: string;
  weather?: string;
  season?: string;
  itemIds: string[];
  images?: string[];
  aiGenerated: boolean;
  aiPrompt?: string;
  rating?: number;
  favorite: boolean;
  wearCount: number;
  lastWorn?: Date;
  tags: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  wear(): Promise<void>;
  isComplete(): boolean;
  getPopulatedItems(): Promise<ClothingItem[]>;
}

const Outfit = sequelize.define<IOutfit>('Outfit', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 100]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  occasion: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 50]
    }
  },
  weather: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  season: {
    type: DataTypes.ENUM('spring', 'summer', 'fall', 'winter'),
    allowNull: true
  },
  itemIds: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
    validate: {
      isValidItemIds(value: string[]) {
        if (!Array.isArray(value)) throw new Error('Item IDs must be an array');
        for (const id of value) {
          if (typeof id !== 'string') {
            throw new Error('All item IDs must be strings');
          }
        }
      }
    }
  },
  images: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
    validate: {
      isValidImages(value: string[]) {
        if (!Array.isArray(value)) return;
        for (const url of value) {
          if (!/^https?:\/\/.+/.test(url) && !url.startsWith('data:image/')) {
            throw new Error('All images must be valid URLs or base64 data URLs');
          }
        }
      }
    }
  },
  aiGenerated: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  aiPrompt: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 5
    }
  },
  favorite: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  wearCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  lastWorn: {
    type: DataTypes.DATE,
    allowNull: true
  },
  tags: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
    validate: {
      isValidTags(value: string[]) {
        if (!Array.isArray(value)) throw new Error('Tags must be an array');
        for (const tag of value) {
          if (typeof tag !== 'string' || tag.length > 30) {
            throw new Error('Each tag must be a string with max 30 characters');
          }
        }
      }
    }
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true,
  indexes: [
    { fields: ['userId', 'occasion'] },
    { fields: ['userId', 'aiGenerated'] },
    { fields: ['userId', 'favorite'] },
    { fields: ['userId', 'lastWorn'] }
  ]
});

// Relationships
Outfit.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(Outfit, { foreignKey: 'userId', as: 'outfits' });

// Instance methods
Outfit.prototype.wear = async function(): Promise<void> {
  this.wearCount += 1;
  this.lastWorn = new Date();
  await this.save();
};

Outfit.prototype.isComplete = function(): boolean {
  return this.itemIds.length >= 3; // At least top, bottom, shoes
};

Outfit.prototype.getPopulatedItems = async function(): Promise<ClothingItem[]> {
  return ClothingItem.findAll({
    where: {
      id: this.itemIds
    }
  });
};

export default Outfit;