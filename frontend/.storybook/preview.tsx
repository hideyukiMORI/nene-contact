import type { Preview } from '@storybook/react-vite';
import '../src/fonts';
import '../src/shared/ui/theme/index.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
