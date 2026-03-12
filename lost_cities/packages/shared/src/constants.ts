// ============================================================
// 失落的城市 (Lost Cities) - 游戏常量
// ============================================================

import { Color, ColorInfo } from './types.js';

/** 游戏颜色列表 */
export const COLORS: Color[] = ['red', 'green', 'blue', 'yellow', 'white'];

/** 颜色显示信息（含中文名） */
export const COLOR_INFO: ColorInfo[] = [
  { id: 'red', name: '红' },
  { id: 'green', name: '绿' },
  { id: 'blue', name: '蓝' },
  { id: 'yellow', name: '黄' },
  { id: 'white', name: '白' },
];

/** 颜色排序映射 */
export const COLOR_ORDER: Record<Color, number> = {
  red: 0,
  green: 1,
  blue: 2,
  yellow: 3,
  white: 4,
};

/** 颜色中文名映射 */
export const COLOR_DISPLAY_NAMES: Record<Color, string> = {
  red: '红',
  green: '绿',
  blue: '蓝',
  yellow: '黄',
  white: '白',
};

/** 探险牌点数列表 */
export const NUMBERS: number[] = [2, 3, 4, 5, 6, 7, 8, 9, 10];

/** 探险成本 */
export const EXPEDITION_COST = 20;

/** 探险列长度奖励阈值 */
export const EXPEDITION_BONUS_THRESHOLD = 8;

/** 探险列长度奖励分数 */
export const EXPEDITION_BONUS_SCORE = 20;

/** 每人初始手牌数 */
export const INITIAL_HAND_SIZE = 8;

/** 默认局数 */
export const DEFAULT_ROUNDS_TOTAL = 3;

/** 断线重连超时时间（毫秒） */
export const RECONNECT_TTL_MS = 60_000;

/** 规则说明数据 */
export const RULE_SECTIONS = [
  {
    title: '基本信息',
    items: [
      '双人对战，使用五种颜色进行探险。',
      '基础牌组共 60 张：探险牌（2-10）与投资牌。',
    ],
  },
  {
    title: '开局准备',
    items: [
      '洗牌后每人 8 张手牌，其余作为抽牌堆。',
      '每种颜色各有一个弃牌堆位。',
    ],
  },
  {
    title: '你的回合',
    items: [
      '每回合必须先出牌，再抽牌。',
      '出牌只能二选一：打入自己探险列，或弃到对应颜色弃牌堆。',
      '抽牌可从牌堆顶，或任一颜色弃牌堆顶抽 1 张。',
    ],
  },
  {
    title: '探险列限制',
    items: [
      '同色牌必须按点数严格递增。',
      '投资牌只能放在该色探险列前端（点数牌之前）。',
      '打出点数牌后，不能再补该色投资牌。',
    ],
  },
  {
    title: '抽牌限制',
    items: [
      '不能抽回自己本回合刚弃掉的那张同色牌。',
      '抽牌后回合立刻结束。',
    ],
  },
  {
    title: '计分规则',
    items: [
      '每种颜色单独结算：点数和 - 20。',
      '有 1/2/3 张投资牌时，分别乘以 2/3/4。',
      '该颜色探险列若达到 8 张及以上，额外 +20 分。',
      '未开始的颜色不计分。',
    ],
  },
  {
    title: '结束与胜负',
    items: [
      '当抽牌堆被抽空时，本小局结束。',
      '通常进行多小局，按约定规则累计后分出胜负。',
    ],
  },
];

/** 快捷聊天消息 */
export const QUICK_CHAT_MESSAGES: string[] = [
  '我先想一下这步',
  '你这步很强',
  '我准备冲高分了',
  '这把稳住别急',
  '最后几张了',
  '打得漂亮',
];

/** 服务端错误消息中文映射 */
export const ERROR_MESSAGE_MAP: Record<string, string> = {
  'Invalid expedition play': '该牌不能这样打到探险列',
  'Not your turn': '还没轮到你操作',
  'Must play before drawing': '请先出牌再抽牌',
  'Card not in hand': '这张牌不在你的手牌中',
  'Discard empty': '该弃牌堆为空',
  'Cannot draw your just-discarded card': '不能立刻抽回你刚弃掉的牌',
  'Waiting players to continue': '请等待双方点击继续',
  'No round to continue': '当前没有可继续的下一局',
  'Empty chat message': '消息不能为空',
};
