/**
 * Types for Multi-Agent System
 */

export interface Task {
  id: string;
  type: 'search' | 'analyze' | 'generate' | 'fetch';
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  priority: number;
  dependencies?: string[]; // Task IDs that must complete first
  input?: any;
  output?: any;
  error?: string;
  agentId?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface Plan {
  id: string;
  goal: string;
  tasks: Task[];
  status: 'planning' | 'executing' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  metadata?: Record<string, any>;
}

export interface AgentState {
  agentId: string;
  type: 'architect' | 'worker' | 'coordinator';
  status: 'idle' | 'busy' | 'error';
  currentTask?: Task;
  completedTasks: string[];
  capabilities: string[];
}

export interface WorkerCapabilities {
  search: {
    platforms: ('vinted' | 'depop')[];
    maxConcurrent: number;
  };
  analyze: {
    types: ('brand' | 'aesthetic' | 'style')[];
  };
  generate: {
    types: ('matrix' | 'recommendations')[];
  };
}

export interface AgentMessage {
  from: string;
  to: string;
  type: 'task_assignment' | 'task_complete' | 'task_failed' | 'status_update';
  payload: any;
  timestamp: Date;
}
