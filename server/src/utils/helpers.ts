import jwt from 'jsonwebtoken';

export const generateToken = (userId: number): string => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '7d',
  });
};

export const getCurrentTime = (): { time: string; date: string } => {
  const now = new Date();
  const time = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
  const date = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;
  return { time, date };
};

export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};
