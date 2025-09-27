import { ConfigProvider, App } from 'antd';
import React from 'react';

// Fix for globalThis.getRootPrefixCls error in production
if (typeof globalThis !== 'undefined') {
  // Ensure globalThis has the required functions for Ant Design
  if (!(globalThis as any).getRootPrefixCls) {
    (globalThis as any).getRootPrefixCls = (suffixCls: string, customizePrefixCls?: string) => {
      if (customizePrefixCls) return customizePrefixCls;
      return suffixCls ? `ant-${suffixCls}` : 'ant';
    };
  }
}

// Ant Design theme configuration
export const antdTheme = {
  token: {
    colorPrimary: '#1890ff',
    borderRadius: 6,
  },
  components: {
    Button: {
      borderRadius: 6,
    },
    Card: {
      borderRadius: 8,
    },
  },
};

// Wrapper component for Ant Design configuration
export const AntdConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ConfigProvider theme={antdTheme}>
      <App>
        {children}
      </App>
    </ConfigProvider>
  );
};
