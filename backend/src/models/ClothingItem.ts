import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

export interface IClothingItem extends Model {
  id: string;
  userId: string;
  name: string;
  category: string;
  subcategory?: string;
  brand?: string;
  color: string;
  colorHex: string;
  size?: string;
  material?: string;
  purchaseDate?: Date;
  purchasePrice?: number;
  condition: 'new' | 'excellent' | 'good' | 'fair' | 'poor';
  images: string[];
  tags: string[];
  favorite: boolean;
  wearCount: number;
  lastWorn?: Date;
  season: ('spring' | 'summer' | 'fall' | 'winter')[];
  occasions: string[];
  notes?: string;
  aiDescription?: string;
  aiTags?: string[];
  createdAt: Date;
  updatedAt: Date;
  wear(): Promise<void>;
  getWearFrequency(): number;
}

const ClothingItem = sequelize.define<IClothingItem>('ClothingItem', {
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
  category: {
    type: DataTypes.ENUM('tops', 'bottoms', 'dresses', 'outerwear', 'shoes', 'accessories'),
    allowNull: false,
    validate: {
      isIn: [['tops', 'bottoms', 'dresses', 'outerwear', 'shoes', 'accessories']]
    }
  },
  subcategory: {
    type: DataTypes.ENUM(
      't-shirts', 'blouses', 'sweaters', 'jackets', 'coats', 'pants', 'jeans',
      'shorts', 'skirts', 'sneakers', 'boots', 'heels', 'sandals', 'watches',
      'jewelry', 'bags', 'belts', 'hats', 'scarves'
    ),
    allowNull: true
  },
  brand: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  color: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  colorHex: {
    type: DataTypes.STRING(7),
    allowNull: false,
    validate: {
      is: /^#[0-9A-F]{6}$/i
    }
  },
  size: {
    type: DataTypes.ENUM(
      'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL',
      '30', '32', '34', '36', '38', '40', '42', '44',
      '5', '6', '7', '8', '9', '10', '11', '12'
    ),
    allowNull: true
  },
  material: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  purchaseDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  purchasePrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  condition: {
    type: DataTypes.ENUM('new', 'excellent', 'good', 'fair', 'poor'),
    allowNull: false,
    defaultValue: 'good'
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
  season: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
    validate: {
      isValidSeasons(value: string[]) {
        if (!Array.isArray(value)) return;
        const validSeasons = ['spring', 'summer', 'fall', 'winter'];
        for (const season of value) {
          if (!validSeasons.includes(season)) {
            throw new Error(`Invalid season: ${season}`);
          }
        }
      }
    }
  },
  occasions: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
    validate: {
      isValidOccasions(value: string[]) {
        if (!Array.isArray(value)) return;
        for (const occasion of value) {
          if (typeof occasion !== 'string' || occasion.length > 50) {
            throw new Error('Each occasion must be a string with max 50 characters');
          }
        }
      }
    }
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  aiDescription: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  aiTags: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
    validate: {
      isValidAiTags(value: string[]) {
        if (!Array.isArray(value)) return;
        for (const tag of value) {
          if (typeof tag !== 'string' || tag.length > 30) {
            throw new Error('Each AI tag must be a string with max 30 characters');
          }
        }
      }
    }
  }
}, {
  timestamps: true,
  indexes: [
    { fields: ['userId', 'category'] },
    { fields: ['userId', 'favorite'] },
    { fields: ['userId', 'lastWorn'] },
    { fields: ['userId', 'color'] },
    { fields: ['userId', 'brand'] },
    { fields: ['tags'] }
  ]
});

// Relationships
ClothingItem.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(ClothingItem, { foreignKey: 'userId', as: 'clothingItems' });

// Instance methods
ClothingItem.prototype.wear = async function(): Promise<void> {
  this.wearCount += 1;
  this.lastWorn = new Date();
  await this.save();
};

ClothingItem.prototype.getWearFrequency = function(): number {
  if (!this.lastWorn) return 0;
  const daysSinceLastWorn = Math.floor((Date.now() - this.lastWorn.getTime()) / (1000 * 60 * 60 * 24));
  if (daysSinceLastWorn === 0) return this.wearCount;
  return this.wearCount / Math.max(daysSinceLastWorn, 1);
};

export default ClothingItem;