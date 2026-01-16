import { useState, useEffect } from 'react';

// ボタンの型定義
type ButtonProps = {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'operator' | 'function' | 'action' | 'equal';
  className?: string;
};

// 共通ボタンコンポーネント
const CalculatorButton = ({ label, onClick, variant = 'default', className = '' }: ButtonProps) => {
  const baseStyle = "flex items-center justify-center text-lg font-medium rounded-xl transition-all active:scale-95 cursor-pointer select-none shadow-sm";
  
  const variants = {
    default: "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200", // 数字
    operator: "bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-100 font-bold", // 四則演算
    function: "bg-gray-800 text-gray-200 hover:bg-gray-700 border border-gray-700 text-sm", // 関数 (sin, cos etc)
    action: "bg-red-50 text-red-500 hover:bg-red-100 border border-red-100 font-bold", // AC, DEL
    equal: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200 shadow-md", // =
  };

  return (
    <button
      onClick={onClick}
      className={`${baseStyle} ${variants[variant]} ${className} h-14 w-full`} // v4ではsize-*も使えますが、grid内なのでh/w指定が安定します
    >
      {label}
    </button>
  );
};

function App() {
  const [expression, setExpression] = useState('');
  const [displayValue, setDisplayValue] = useState('0');
  const [isRad, setIsRad] = useState(false); // Default to Degree
  const [history, setHistory] = useState<string>('');

  // キーボード入力のサポート
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      if (/[0-9]/.test(key)) handleInput(key);
      if (['+', '-', '*', '/', '(', ')', '.'].includes(key)) handleInput(key);
      if (key === 'Enter') handleCalculate();
      if (key === 'Backspace') handleDelete();
      if (key === 'Escape') handleClear();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [expression, isRad]);

  // 入力処理
  const handleInput = (val: string) => {
    if (displayValue === 'Error') {
      setExpression(val);
      setDisplayValue(val);
    } else {
      // 直前の計算結果がある状態で数字を押したらリセット、演算子なら継続
      const nextExpr = expression === displayValue && !['+', '-', '*', '/', '^'].includes(val) 
        ? val 
        : expression + val;
      
      setExpression(nextExpr);
      setDisplayValue(nextExpr);
    }
  };

  // 削除 (DEL)
  const handleDelete = () => {
    if (displayValue === 'Error') {
      handleClear();
      return;
    }
    const newExpr = expression.slice(0, -1);
    setExpression(newExpr);
    setDisplayValue(newExpr || '0');
  };

  // 全消去 (AC)
  const handleClear = () => {
    setExpression('');
    setDisplayValue('0');
    setHistory('');
  };

  // 計算実行 (=)
  const handleCalculate = () => {
    try {
      let evalExpr = expression;

      // 表示用の記号をJavaScriptの計算式に変換
      evalExpr = evalExpr.replace(/×/g, '*').replace(/÷/g, '/').replace(/π/g, 'Math.PI').replace(/e/g, 'Math.E');
      
      // 指数計算 (^)
      evalExpr = evalExpr.replace(/(\d+(\.\d+)?)\^(\d+(\.\d+)?)/g, 'Math.pow($1, $3)');

      // 平方根 (√)
      evalExpr = evalExpr.replace(/√\(([^)]+)\)/g, 'Math.sqrt($1)');
      evalExpr = evalExpr.replace(/√(\d+)/g, 'Math.sqrt($1)');

      // 三角関数・対数などの変換
      // 注意: 単純な置換ですが、デモとしては機能します
      const mathFuncs = ['sin', 'cos', 'tan', 'log', 'log10', 'abs'];
      
      mathFuncs.forEach((func) => {
        const regex = new RegExp(`${func}\\(`, 'g');
        if (func === 'log') {
           // 自然対数 ln
           evalExpr = evalExpr.replace(/ln\(/g, 'Math.log(');
        } else if (func === 'log10') {
           // 常用対数 log
           evalExpr = evalExpr.replace(/log\(/g, 'Math.log10(');
        } else {
           // 三角関数の Degree/Radian 変換
           if (['sin', 'cos', 'tan'].includes(func) && !isRad) {
             // Degree mode: convert inner value to radians: sin(90) -> Math.sin(90 * Math.PI / 180)
             // 簡易的な実装のため、引数が単純な数値であることを想定しています
             evalExpr = evalExpr.replace(new RegExp(`${func}\\(([0-9.]+|\\([^)]+\\))\\)`, 'g'), (match, p1) => {
                return `Math.${func}((${p1}) * Math.PI / 180)`;
             });
           } else {
             evalExpr = evalExpr.replace(regex, `Math.${func}(`);
           }
        }
      });

      // 安全な計算実行（new Functionを使用）
      // eslint-disable-next-line no-new-func
      const result = new Function(`return ${evalExpr}`)();
      
      // 精度調整（浮動小数点誤差の緩和）
      const finalResult = Math.round(result * 1000000000) / 1000000000;
      
      setHistory(expression);
      setDisplayValue(String(finalResult));
      setExpression(String(finalResult));

    } catch (error) {
      setDisplayValue('Error');
      setExpression('');
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-gray-100 text-gray-900 font-sans p-4">
      
      {/* Calculator Body */}
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200">
        
        {/* Display Section */}
        <div className="bg-slate-900 p-6 text-right relative overflow-hidden">
           {/* Background Decoration */}
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

          <div className="h-8 text-gray-400 text-sm font-mono overflow-hidden whitespace-nowrap">
            {history}
          </div>
          <div className="mt-2 h-16 flex items-end justify-end overflow-x-auto overflow-y-hidden scrollbar-hide">
            <span className="text-4xl font-bold text-white tracking-wider font-mono">
              {displayValue}
            </span>
          </div>
          
          {/* Mode Indicator */}
          <div className="absolute top-4 left-4">
             <button 
               onClick={() => setIsRad(!isRad)}
               className="text-[10px] font-bold px-2 py-1 rounded bg-slate-700 text-gray-300 hover:bg-slate-600 transition cursor-pointer"
             >
               {isRad ? 'RAD' : 'DEG'}
             </button>
          </div>
        </div>

        {/* Keypad Section */}
        <div className="p-4 bg-gray-50">
          
          {/* Scientific Functions Row */}
          <div className="grid grid-cols-5 gap-2 mb-2">
             <CalculatorButton label="sin" variant="function" onClick={() => handleInput('sin(')} />
             <CalculatorButton label="cos" variant="function" onClick={() => handleInput('cos(')} />
             <CalculatorButton label="tan" variant="function" onClick={() => handleInput('tan(')} />
             <CalculatorButton label="π" variant="function" onClick={() => handleInput('π')} />
             <CalculatorButton label="e" variant="function" onClick={() => handleInput('e')} />
             
             <CalculatorButton label="ln" variant="function" onClick={() => handleInput('ln(')} />
             <CalculatorButton label="log" variant="function" onClick={() => handleInput('log(')} />
             <CalculatorButton label="√" variant="function" onClick={() => handleInput('√(')} />
             <CalculatorButton label="^" variant="function" onClick={() => handleInput('^')} />
             <CalculatorButton label="(" variant="function" onClick={() => handleInput('(')} />
          </div>

          <hr className="border-gray-200 my-3" />

          {/* Main Keypad */}
          <div className="grid grid-cols-4 gap-3">
            <CalculatorButton label="AC" variant="action" onClick={handleClear} />
            <CalculatorButton label="DEL" variant="action" onClick={handleDelete} />
            <CalculatorButton label=")" variant="operator" onClick={() => handleInput(')')} />
            <CalculatorButton label="÷" variant="operator" onClick={() => handleInput('/')} />

            <CalculatorButton label="7" onClick={() => handleInput('7')} />
            <CalculatorButton label="8" onClick={() => handleInput('8')} />
            <CalculatorButton label="9" onClick={() => handleInput('9')} />
            <CalculatorButton label="×" variant="operator" onClick={() => handleInput('*')} />

            <CalculatorButton label="4" onClick={() => handleInput('4')} />
            <CalculatorButton label="5" onClick={() => handleInput('5')} />
            <CalculatorButton label="6" onClick={() => handleInput('6')} />
            <CalculatorButton label="-" variant="operator" onClick={() => handleInput('-')} />

            <CalculatorButton label="1" onClick={() => handleInput('1')} />
            <CalculatorButton label="2" onClick={() => handleInput('2')} />
            <CalculatorButton label="3" onClick={() => handleInput('3')} />
            <CalculatorButton label="+" variant="operator" onClick={() => handleInput('+')} />

            <CalculatorButton label="0" className="col-span-2" onClick={() => handleInput('0')} />
            <CalculatorButton label="." onClick={() => handleInput('.')} />
            <CalculatorButton label="=" variant="equal" onClick={handleCalculate} />
          </div>
        </div>
      </div>

      <p className="mt-8 text-xs text-gray-400">
        Tailwind v4 Scientific Calculator Demo
      </p>
    </div>
  );
}

export default App;