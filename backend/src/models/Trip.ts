import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

export interface ITrip extends Model {
  id: string;
  userId: string;
  destination: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  weather: string;
  temperature: number;
  duration: number;
  packingList: {
    itemId: string;
    packed: boolean;
    category: string;
    aiSuggested: boolean;
  }[];
  aiGenerated: boolean;
  aiPrompt?: string;
  notes?: string;
  status: 'planning' | 'active' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
  getPackingProgress(): number;
  updatePackingStatus(itemId: string, packed: boolean): Promise<void>;
}

const Trip = sequelize.define<ITrip>('Trip', {
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
  destination: {
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
  startDate: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      isAfter: new Date().toISOString()
    }
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      isAfter: DataTypes.NOW
    }
  },
  weather: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 50]
    }
  },
  temperature: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: -50,
      max: 60
    }
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: 1
    }
  },
  packingList: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
    validate: {
      isValidPackingList(value: any[]) {
        if (!Array.isArray(value)) throw new Error('Packing list must be an array');
        for (const item of value) {
          if (!item.itemId || !item.category) {
            throw new Error('Each packing item must have itemId and category');
          }
          const validCategories = ['tops', 'bottoms', 'dresses', 'outerwear', 'shoes', 'accessories', 'toiletries', 'electronics', 'documents'];
          if (!validCategories.includes(item.category)) {
            throw new Error(`Invalid category: ${item.category}`);
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
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('planning', 'active', 'completed', 'cancelled'),
    allowNull: false,
    defaultValue: 'planning'
  }
}, {
  timestamps: true,
  indexes: [
    { fields: ['userId', 'startDate'] },
    { fields: ['userId', 'status'] }
  ],
  hooks: {
    beforeCreate: (trip) => {
      // Calculate duration
      const duration = Math.ceil((trip.endDate.getTime() - trip.startDate.getTime()) / (1000 * 60 * 60 * 24));
      trip.duration = Math.max(1, duration);
    },
    beforeUpdate: (trip) => {
      // Recalculate duration if dates changed
      if (trip.changed('startDate') || trip.changed('endDate')) {
        const duration = Math.ceil((trip.endDate.getTime() - trip.startDate.getTime()) / (1000 * 60 * 60 * 24));
        trip.duration = Math.max(1, duration);
      }
    }
  }
});

// Relationships
Trip.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(Trip, { foreignKey: 'userId', as: 'trips' });

// Instance methods
Trip.prototype.getPackingProgress = function(): number {
  if (this.packingList.length === 0) return 0;
  const packed = this.packingList.filter(item => item.packed).length;
  return Math.round((packed / this.packingList.length) * 100);
};

Trip.prototype.updatePackingStatus = async function(itemId: string, packed: boolean): Promise<void> {
  const itemIndex = this.packingList.findIndex(item => item.itemId === itemId);
  if (itemIndex === -1) {
    throw new Error('Item not found in packing list');
  }

  this.packingList[itemIndex].packed = packed;
  await this.save();
};

// Static methods
Trip.getUpcomingTrips = async function(userId: string, limit: number = 5) {
  return this.findAll({
    where: {
      userId,
      startDate: {
        [sequelize.Op.gte]: new Date()
      },
      status: ['planning', 'active']
    },
    order: [['startDate', 'ASC']],
    limit
  });
};

export default Trip;