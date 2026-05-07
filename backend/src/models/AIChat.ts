import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

export interface IAIChat extends Model {
  id: string;
  userId: string;
  title?: string;
  messages: {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    outfitSuggestion?: string;
    itemSuggestions?: string[];
  }[];
  context: {
    wardrobeItems: number;
    recentOutfits: string[];
    userPreferences: string[];
    weather?: string;
    occasion?: string;
  };
  isActive: boolean;
  lastActivity: Date;
  createdAt: Date;
  updatedAt: Date;
  addMessage(role: 'user' | 'assistant', content: string, suggestions?: any): Promise<void>;
  getRecentMessages(limit?: number): any[];
}

const AIChat = sequelize.define<IAIChat>('AIChat', {
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
  title: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue() {
      const now = new Date();
      return `Chat ${now.toLocaleDateString()}`;
    }
  },
  messages: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
    validate: {
      isValidMessages(value: any[]) {
        if (!Array.isArray(value)) throw new Error('Messages must be an array');
        for (const message of value) {
          if (!message.role || !['user', 'assistant'].includes(message.role)) {
            throw new Error('Invalid message role');
          }
          if (!message.content || typeof message.content !== 'string') {
            throw new Error('Message content is required');
          }
        }
      }
    }
  },
  context: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {
      wardrobeItems: 0,
      recentOutfits: [],
      userPreferences: []
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  lastActivity: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: true,
  indexes: [
    { fields: ['userId', 'isActive'] },
    { fields: ['userId', 'lastActivity'] }
  ]
});

// Relationships
AIChat.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(AIChat, { foreignKey: 'userId', as: 'aiChats' });

// Instance methods
AIChat.prototype.addMessage = async function(
  role: 'user' | 'assistant',
  content: string,
  suggestions?: any
): Promise<void> {
  this.messages.push({
    role,
    content,
    timestamp: new Date(),
    ...suggestions
  });
  this.lastActivity = new Date();
  await this.save();
};

AIChat.prototype.getRecentMessages = function(limit: number = 10): any[] {
  return this.messages.slice(-limit);
};

// Static methods
AIChat.getActiveChat = async function(userId: string) {
  return this.findOne({
    where: { userId, isActive: true }
  });
};

AIChat.createNewChat = async function(userId: string, title?: string) {
  // Mark previous active chat as inactive
  await this.update(
    { isActive: false },
    { where: { userId, isActive: true } }
  );

  // Create new chat
  return this.create({
    userId,
    title: title || `Chat ${new Date().toLocaleDateString()}`,
    messages: [],
    context: {
      wardrobeItems: 0,
      recentOutfits: [],
      userPreferences: []
    }
  });
};

export default AIChat;