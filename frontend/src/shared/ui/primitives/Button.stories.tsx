import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '@/shared/ui/primitives/Button';

const meta = {
  title: 'Primitives/Button',
  component: Button,
  args: { children: 'Save' },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Disabled: Story = {
  args: { disabled: true },
};
