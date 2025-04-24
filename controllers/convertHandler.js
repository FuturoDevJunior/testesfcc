function ConvertHandler() {
  // Lista de unidades válidas e seus pares de conversão
  const unitMap = {
    'gal': { returnUnit: 'L', spell: 'gallons', factor: 3.78541 },
    'l':   { returnUnit: 'gal', spell: 'liters', factor: 1/3.78541 },
    'mi':  { returnUnit: 'km', spell: 'miles', factor: 1.60934 },
    'km':  { returnUnit: 'mi', spell: 'kilometers', factor: 1/1.60934 },
    'lbs': { returnUnit: 'kg', spell: 'pounds', factor: 0.453592 },
    'kg':  { returnUnit: 'lbs', spell: 'kilograms', factor: 1/0.453592 }
  };
  const validUnits = Object.keys(unitMap);

  // Extrai e valida o número
  this.getNum = function(input) {
    let result;
    const numMatch = input.match(/^[^a-zA-Z]*/)[0];
    if (numMatch === '') return 1;
    if ((numMatch.match(/\//g) || []).length > 1) return 'invalid number';
    try {
      if (numMatch.includes('/')) {
        const [num, denom] = numMatch.split('/');
        if (denom === undefined || denom === '') return 'invalid number';
        result = parseFloat(num) / parseFloat(denom);
      } else {
        result = parseFloat(numMatch);
      }
      if (isNaN(result)) return 'invalid number';
      return result;
    } catch {
      return 'invalid number';
    }
  };

  // Extrai e valida a unidade
  this.getUnit = function(input) {
    let result;
    const unitMatch = input.match(/[a-zA-Z]+$/);
    if (!unitMatch) return 'invalid unit';
    let unit = unitMatch[0].toLowerCase();
    if (unit === 'l') unit = 'l'; // 'L' pode vir maiúsculo
    if (!validUnits.includes(unit)) return 'invalid unit';
    // Retorna 'L' maiúsculo, demais minúsculo
    return unit === 'l' ? 'L' : unit;
  };

  // Retorna a unidade de destino
  this.getReturnUnit = function(initUnit) {
    if (!initUnit) return undefined;
    let unit = initUnit.toLowerCase();
    if (unit === 'l') unit = 'l';
    if (!unitMap[unit]) return 'invalid unit';
    return unitMap[unit].returnUnit;
  };

  // Nome extenso da unidade
  this.spellOutUnit = function(unit) {
    if (!unit) return undefined;
    let u = unit.toLowerCase();
    if (u === 'l') u = 'l';
    if (!unitMap[u]) return 'invalid unit';
    return unitMap[u].spell;
  };

  // Conversão numérica
  this.convert = function(initNum, initUnit) {
    let unit = initUnit.toLowerCase();
    if (unit === 'l') unit = 'l';
    if (!unitMap[unit]) return 'invalid unit';
    let result = initNum * unitMap[unit].factor;
    return Number(result.toFixed(5));
  };

  // Frase descritiva
  this.getString = function(initNum, initUnit, returnNum, returnUnit) {
    const initUnitStr = this.spellOutUnit(initUnit);
    const returnUnitStr = this.spellOutUnit(returnUnit);
    return `${initNum} ${initUnitStr} converts to ${returnNum} ${returnUnitStr}`;
  };
}

module.exports = ConvertHandler;
