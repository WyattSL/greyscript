using System;
using System.Collections.Generic;
using System.Linq;

namespace Miniscript
{
	// Token: 0x0200096C RID: 2412
	public static class Intrinsics
	{
		// Token: 0x060044B0 RID: 17584 RVA: 0x001098D8 File Offset: 0x00107AD8
		public static void InitIfNeeded()
		{
			if (Intrinsics.initialized)
			{
				return;
			}
			Intrinsics.initialized = true;
			Intrinsic intrinsic = Intrinsic.Create("abs");
			intrinsic.AddParam("x", 0.0);
			intrinsic.code = delegate(TAC.Context context, Intrinsic.Result partialResult)
			{
				Value var = context.GetVar("x");
				if (var != null)
				{
					return new Intrinsic.Result(Math.Abs(var.DoubleValue()));
				}
				return Intrinsic.Result.Null;
			};
			Intrinsic intrinsic2 = Intrinsic.Create("acos");
			intrinsic2.AddParam("x", 0.0);
			intrinsic2.code = delegate(TAC.Context context, Intrinsic.Result partialResult)
			{
				Value var = context.GetVar("x");
				if (var != null)
				{
					return new Intrinsic.Result(Math.Acos(var.DoubleValue()));
				}
				return Intrinsic.Result.Null;
			};
			Intrinsic intrinsic3 = Intrinsic.Create("asin");
			intrinsic3.AddParam("x", 0.0);
			intrinsic3.code = delegate(TAC.Context context, Intrinsic.Result partialResult)
			{
				Value var = context.GetVar("x");
				if (var != null)
				{
					return new Intrinsic.Result(Math.Asin(var.DoubleValue()));
				}
				return Intrinsic.Result.Null;
			};
			Intrinsic intrinsic4 = Intrinsic.Create("atan");
			intrinsic4.AddParam("x", 0.0);
			intrinsic4.code = delegate(TAC.Context context, Intrinsic.Result partialResult)
			{
				Value var = context.GetVar("x");
				if (var != null)
				{
					return new Intrinsic.Result(Math.Atan(var.DoubleValue()));
				}
				return Intrinsic.Result.Null;
			};
			Intrinsic intrinsic5 = Intrinsic.Create("char");
			intrinsic5.AddParam("codePoint", 65.0);
			intrinsic5.code = delegate(TAC.Context context, Intrinsic.Result partialResult)
			{
				Value var = context.GetVar("codePoint");
				if (var == null)
				{
					return Intrinsic.Result.Null;
				}
				int num = var.IntValue();
				if (!GreyInterpreter.IsValidUnicodeChar(num))
				{
					throw new IndexException("char: invalid char code.");
				}
				return new Intrinsic.Result(char.ConvertFromUtf32(num));
			};
			Intrinsic intrinsic6 = Intrinsic.Create("ceil");
			intrinsic6.AddParam("x", 0.0);
			intrinsic6.code = delegate(TAC.Context context, Intrinsic.Result partialResult)
			{
				Value var = context.GetVar("x");
				if (var != null)
				{
					return new Intrinsic.Result(Math.Ceiling(var.DoubleValue()));
				}
				return Intrinsic.Result.Null;
			};
			Intrinsic intrinsic7 = Intrinsic.Create("code");
			intrinsic7.AddParam("self", null);
			intrinsic7.code = delegate(TAC.Context context, Intrinsic.Result partialResult)
			{
				Value var = context.GetVar("self");
				int num = 0;
				if (var != null)
				{
					num = char.ConvertToUtf32(var.ToString(), 0);
				}
				if (!GreyInterpreter.IsValidUnicodeChar(num))
				{
					throw new IndexException("code: invalid char code.");
				}
				return new Intrinsic.Result((double)num);
			};
			Intrinsic intrinsic8 = Intrinsic.Create("cos");
			intrinsic8.AddParam("radians", 0.0);
			intrinsic8.code = delegate(TAC.Context context, Intrinsic.Result partialResult)
			{
				Value var = context.GetVar("radians");
				if (var != null)
				{
					return new Intrinsic.Result(Math.Cos(var.DoubleValue()));
				}
				return Intrinsic.Result.Null;
			};
			Intrinsic intrinsic9 = Intrinsic.Create("floor");
			intrinsic9.AddParam("x", 0.0);
			intrinsic9.code = delegate(TAC.Context context, Intrinsic.Result partialResult)
			{
				Value var = context.GetVar("x");
				if (var != null)
				{
					return new Intrinsic.Result(Math.Floor(var.DoubleValue()));
				}
				return Intrinsic.Result.Null;
			};
			Intrinsic intrinsic10 = Intrinsic.Create("hash");
			intrinsic10.AddParam("obj", null);
			intrinsic10.code = delegate(TAC.Context context, Intrinsic.Result partialResult)
			{
				GreyInterpreter greyInterpreter = context.interpreter as GreyInterpreter;
				if ((greyInterpreter.hostData as Player).GetHelperScript(greyInterpreter.terminalPID).isBackgroundSsh)
				{
					throw new RuntimeException("hash: unable to use this method in encryption configuration");
				}
				Value var = context.GetVar("obj");
				if (var == null)
				{
					return Intrinsic.Result.Null;
				}
				return new Intrinsic.Result((double)var.Hash(16));
			};
			Intrinsic intrinsic11 = Intrinsic.Create("hasIndex");
			intrinsic11.AddParam("self", null);
			intrinsic11.AddParam("index", null);
			intrinsic11.code = delegate(TAC.Context context, Intrinsic.Result partialResult)
			{
				Value var = context.GetVar("self");
				Value var2 = context.GetVar("index");
				if (var2 == null)
				{
					throw new RuntimeException("hasIndex requires an index argument");
				}
				if (var is ValList)
				{
					List<Value> values = ((ValList)var).values;
					int num = var2.IntValue();
					return new Intrinsic.Result(ValNumber.Truth(num >= -values.Count && num < values.Count), true);
				}
				if (var is ValString)
				{
					string value = ((ValString)var).value;
					int num2 = var2.IntValue();
					return new Intrinsic.Result(ValNumber.Truth(num2 >= -value.Length && num2 < value.Length), true);
				}
				if (var is ValMap)
				{
					return new Intrinsic.Result(ValNumber.Truth(((ValMap)var).ContainsKey(var2)), true);
				}
				return Intrinsic.Result.Null;
			};
			Intrinsic intrinsic12 = Intrinsic.Create("indexes");
			intrinsic12.AddParam("self", null);
			intrinsic12.code = delegate(TAC.Context context, Intrinsic.Result partialResult)
			{
				Value var = context.GetVar("self");
				if (var is ValMap)
				{
					return new Intrinsic.Result(new ValList(new List<Value>(((ValMap)var).map.Keys)), true);
				}
				if (var is ValString)
				{
					string value = ((ValString)var).value;
					List<Value> list = new List<Value>(value.Length);
					for (int i = 0; i < value.Length; i++)
					{
						list.Add(TAC.Num((double)i));
					}
					return new Intrinsic.Result(new ValList(list), true);
				}
				if (var is ValList)
				{
					List<Value> values = ((ValList)var).values;
					List<Value> list2 = new List<Value>(values.Count);
					for (int j = 0; j < values.Count; j++)
					{
						list2.Add(TAC.Num((double)j));
					}
					return new Intrinsic.Result(new ValList(list2), true);
				}
				return Intrinsic.Result.Null;
			};
			Intrinsic intrinsic13 = Intrinsic.Create("indexOf");
			intrinsic13.AddParam("self", null);
			intrinsic13.AddParam("value", null);
			intrinsic13.AddParam("after", null);
			intrinsic13.code = delegate(TAC.Context context, Intrinsic.Result partialResult)
			{
				Value var = context.GetVar("self");
				Value value = context.GetVar("value");
				if (value == null)
				{
					throw new RuntimeException("indexOf requires a value argument");
				}
				Value var2 = context.GetVar("after");
				if (var is ValList)
				{
					List<Value> values = ((ValList)var).values;
					int num;
					if (var2 == null)
					{
						num = values.FindIndex((Value x) => x.Equality(value, 16) == 1.0);
					}
					else
					{
						int num2 = var2.IntValue();
						if (num2 < -1)
						{
							num2 += values.Count;
						}
						if (num2 < -1 || num2 >= values.Count - 1)
						{
							return Intrinsic.Result.Null;
						}
						num = values.FindIndex(num2 + 1, (Value x) => x.Equality(value, 16) == 1.0);
					}
					if (num >= 0)
					{
						return new Intrinsic.Result((double)num);
					}
				}
				else if (var is ValString)
				{
					string value4 = ((ValString)var).value;
					string value2 = value.ToString();
					int num3;
					if (var2 == null)
					{
						num3 = value4.IndexOf(value2);
					}
					else
					{
						int num4 = var2.IntValue();
						if (num4 < -1)
						{
							num4 += value4.Length;
						}
						if (num4 < -1 || num4 >= value4.Length - 1)
						{
							return Intrinsic.Result.Null;
						}
						num3 = value4.IndexOf(value2, num4 + 1);
					}
					if (num3 >= 0)
					{
						return new Intrinsic.Result((double)num3);
					}
				}
				else if (var is ValMap)
				{
					ValMap valMap = (ValMap)var;
					bool flag = var2 == null;
					foreach (Value value3 in valMap.map.Keys)
					{
						if (!flag)
						{
							if (value3.Equality(var2, 16) == 1.0)
							{
								flag = true;
							}
						}
						else if (valMap.map[value3].Equality(value, 16) == 1.0)
						{
							return new Intrinsic.Result(value3, true);
						}
					}
				}
				return Intrinsic.Result.Null;
			};
			Intrinsic intrinsic14 = Intrinsic.Create("len");
			intrinsic14.AddParam("self", null);
			intrinsic14.code = delegate(TAC.Context context, Intrinsic.Result partialResult)
			{
				Value var = context.GetVar("self");
				if (var is ValList)
				{
					return new Intrinsic.Result((double)((ValList)var).values.Count);
				}
				if (var is ValString)
				{
					return new Intrinsic.Result((double)((ValString)var).value.Length);
				}
				if (var is ValMap)
				{
					return new Intrinsic.Result((double)((ValMap)var).Count);
				}
				return Intrinsic.Result.Null;
			};
			Intrinsic intrinsic15 = Intrinsic.Create("lower");
			intrinsic15.AddParam("self", null);
			intrinsic15.code = delegate(TAC.Context context, Intrinsic.Result partialResult)
			{
				Value var = context.GetVar("self");
				if (var is ValString)
				{
					return new Intrinsic.Result(((ValString)var).value.ToLower());
				}
				return new Intrinsic.Result(var, true);
			};
			Intrinsic.Create("pi").code = ((TAC.Context context, Intrinsic.Result partialResult) => new Intrinsic.Result(3.141592653589793));
			Intrinsic intrinsic16 = Intrinsic.Create("print");
			intrinsic16.AddParam("s", ValString.empty);
			intrinsic16.code = delegate(TAC.Context context, Intrinsic.Result partialResult)
			{
				GreyInterpreter greyInterpreter = (GreyInterpreter)context.interpreter;
				HelperScript helperScript = ((Player)greyInterpreter.hostData).GetHelperScript(greyInterpreter.terminalPID);
				if (helperScript != null)
				{
					Value var = context.GetVar("s");
					if (var != null)
					{
						helperScript.AddOutput(var.ToString());
					}
					else
					{
						helperScript.AddOutput("null");
					}
				}
				return Intrinsic.Result.Null;
			};
			Intrinsic intrinsic17 = Intrinsic.Create("pop");
			intrinsic17.AddParam("self", null);
			intrinsic17.code = delegate(TAC.Context context, Intrinsic.Result partialResult)
			{
				Value var = context.GetVar("self");
				if (var is GreyMap)
				{
					return Intrinsic.Result.Null;
				}
				if (var is ValList)
				{
					List<Value> values = ((ValList)var).values;
					if (values.Count < 1)
					{
						return Intrinsic.Result.Null;
					}
					Value result = values[values.Count - 1];
					values.RemoveAt(values.Count - 1);
					return new Intrinsic.Result(result, true);
				}
				else
				{
					if (!(var is ValMap))
					{
						return Intrinsic.Result.Null;
					}
					ValMap valMap = (ValMap)var;
					if (valMap.map.Count < 1)
					{
						return Intrinsic.Result.Null;
					}
					Value value = valMap.map.Keys.First<Value>();
					valMap.map.Remove(value);
					return new Intrinsic.Result(value, true);
				}
			};
			Intrinsic intrinsic18 = Intrinsic.Create("pull");
			intrinsic18.AddParam("self", null);
			intrinsic18.code = delegate(TAC.Context context, Intrinsic.Result partialResult)
			{
				Value var = context.GetVar("self");
				if (var is GreyMap)
				{
					return Intrinsic.Result.Null;
				}
				if (var is ValList)
				{
					List<Value> values = ((ValList)var).values;
					if (values.Count < 1)
					{
						return Intrinsic.Result.Null;
					}
					Value result = values[0];
					values.RemoveAt(0);
					return new Intrinsic.Result(result, true);
				}
				else
				{
					if (!(var is ValMap))
					{
						return Intrinsic.Result.Null;
					}
					ValMap valMap = (ValMap)var;
					if (valMap.map.Count < 1)
					{
						return Intrinsic.Result.Null;
					}
					Value value = valMap.map.Keys.First<Value>();
					valMap.map.Remove(value);
					return new Intrinsic.Result(value, true);
				}
			};
			Intrinsic intrinsic19 = Intrinsic.Create("push");
			intrinsic19.AddParam("self", null);
			intrinsic19.AddParam("value", null);
			intrinsic19.code = delegate(TAC.Context context, Intrinsic.Result partialResult)
			{
				Value var = context.GetVar("self");
				Value var2 = context.GetVar("value");
				if (var == var2)
				{
					throw new RuntimeException("(push) Unable to stack to itself");
				}
				if (var is GreyMap)
				{
					return Intrinsic.Result.Null;
				}
				var.CheckLimits(var2);
				if (var is ValList)
				{
					((ValList)var).values.Add(var2);
					return new Intrinsic.Result(var, true);
				}
				if (!(var is ValMap))
				{
					return Intrinsic.Result.Null;
				}
				ValMap valMap = (ValMap)var;
				if (var2 == null)
				{
					throw new RuntimeException("Key map cannot be null.");
				}
				if (valMap.map.ContainsKey(var2))
				{
					throw new RuntimeException("Key map has already been added: " + var2.ToString());
				}
				valMap.map.Add(var2, ValNumber.one);
				return new Intrinsic.Result(var, true);
			};
			Intrinsic intrinsic20 = Intrinsic.Create("range");
			intrinsic20.AddParam("from", 0.0);
			intrinsic20.AddParam("to", 0.0);
			intrinsic20.AddParam("step", null);
			intrinsic20.code = delegate(TAC.Context context, Intrinsic.Result partialResult)
			{
				Value var = context.GetVar("from");
				Value var2 = context.GetVar("to");
				Value var3 = context.GetVar("step");
				if (!(var2 is ValNumber))
				{
					throw new RuntimeException("range() \"to\" parameter not a number");
				}
				double num = var.DoubleValue();
				double num2 = var2.DoubleValue();
				double num3 = (double)((num2 >= num) ? 1 : -1);
				if (var3 is ValNumber)
				{
					num3 = (var3 as ValNumber).value;
				}
				if (num3 == 0.0)
				{
					throw new RuntimeException("range() error (step==0)");
				}
				List<Value> list = new List<Value>();
				if ((num2 - num) / num3 > 1000000.0)
				{
					throw new RuntimeException("list too large");
				}
				try
				{
					double num4 = num;
					while ((num3 > 0.0) ? (num4 <= num2) : (num4 >= num2))
					{
						list.Add(TAC.Num(num4));
						num4 += num3;
					}
				}
				catch (SystemException inner)
				{
					list = null;
					throw new RuntimeException("range() error", inner);
				}
				return new Intrinsic.Result(new ValList(list), true);
			};
			Intrinsic intrinsic21 = Intrinsic.Create("remove");
			intrinsic21.AddParam("self", null);
			intrinsic21.AddParam("k", null);
			intrinsic21.code = delegate(TAC.Context context, Intrinsic.Result partialResult)
			{
				Value var = context.GetVar("self");
				Value var2 = context.GetVar("k");
				if (var == null || var2 == null)
				{
					throw new RuntimeException("argument to 'remove' must not be null");
				}
				if (var is GreyMap)
				{
					return Intrinsic.Result.Null;
				}
				if (var is ValMap)
				{
					ValMap valMap = (ValMap)var;
					if (valMap.map.ContainsKey(var2))
					{
						valMap.map.Remove(var2);
						return new Intrinsic.Result(ValNumber.one, true);
					}
					return new Intrinsic.Result(ValNumber.zero, true);
				}
				else
				{
					if (var is ValList)
					{
						ValList valList = (ValList)var;
						int num = var2.IntValue();
						if (num < 0)
						{
							num += valList.values.Count;
						}
						Check.Range(num, 0, valList.values.Count - 1, "index");
						valList.values.RemoveAt(num);
						return Intrinsic.Result.Null;
					}
					if (!(var is ValString))
					{
						throw new TypeException("Type Error: 'remove' requires map, list, or string");
					}
					ValString valString = (ValString)var;
					string text = var2.ToString();
					int num2 = valString.value.IndexOf(text);
					if (num2 < 0)
					{
						return new Intrinsic.Result(var, true);
					}
					return new Intrinsic.Result(valString.value.Remove(num2, text.Length));
				}
			};
			Intrinsic intrinsic22 = Intrinsic.Create("round");
			intrinsic22.AddParam("x", 0.0);
			intrinsic22.AddParam("decimalPlaces", 0.0);
			intrinsic22.code = delegate(TAC.Context context, Intrinsic.Result partialResult)
			{
				double value = context.GetVar("x").DoubleValue();
				int num = context.GetVar("decimalPlaces").IntValue();
				if (num < 0 || num > 15)
				{
					throw new RuntimeException("Rounding digits must be between 0 and 15, inclusive.");
				}
				return new Intrinsic.Result(Math.Round(value, num));
			};
			Intrinsic intrinsic23 = Intrinsic.Create("rnd");
			intrinsic23.AddParam("seed", null);
			intrinsic23.code = delegate(TAC.Context context, Intrinsic.Result partialResult)
			{
				if (Intrinsics.random == null)
				{
					Intrinsics.random = new Random();
				}
				Value var = context.GetVar("seed");
				if (var != null)
				{
					Intrinsics.random = new Random(var.IntValue());
				}
				return new Intrinsic.Result(Intrinsics.random.NextDouble());
			};
			Intrinsic intrinsic24 = Intrinsic.Create("sign");
			intrinsic24.AddParam("x", 0.0);
			intrinsic24.code = ((TAC.Context context, Intrinsic.Result partialResult) => new Intrinsic.Result((double)Math.Sign(context.GetVar("x").DoubleValue())));
			Intrinsic intrinsic25 = Intrinsic.Create("sin");
			intrinsic25.AddParam("radians", 0.0);
			intrinsic25.code = ((TAC.Context context, Intrinsic.Result partialResult) => new Intrinsic.Result(Math.Sin(context.GetVar("radians").DoubleValue())));
			Intrinsic intrinsic26 = Intrinsic.Create("slice");
			intrinsic26.AddParam("seq", null);
			intrinsic26.AddParam("from", 0.0);
			intrinsic26.AddParam("to", null);
			intrinsic26.code = delegate(TAC.Context context, Intrinsic.Result partialResult)
			{
				Value var = context.GetVar("seq");
				Value var2 = context.GetVar("from");
				if (var2 == null)
				{
					return Intrinsic.Result.Null;
				}
				int num = var2.IntValue();
				Value var3 = context.GetVar("to");
				int num2 = 0;
				if (var3 != null)
				{
					num2 = var3.IntValue();
				}
				if (var is ValList)
				{
					List<Value> values = ((ValList)var).values;
					if (num < 0)
					{
						num += values.Count;
					}
					if (num < 0)
					{
						num = 0;
					}
					if (var3 == null)
					{
						num2 = values.Count;
					}
					if (num2 < 0)
					{
						num2 += values.Count;
					}
					if (num2 > values.Count)
					{
						num2 = values.Count;
					}
					ValList valList = new ValList(null);
					if (num < values.Count && num2 > num)
					{
						for (int i = num; i < num2; i++)
						{
							valList.values.Add(values[i]);
						}
					}
					return new Intrinsic.Result(valList, true);
				}
				if (var is ValString)
				{
					string value = ((ValString)var).value;
					if (num < 0)
					{
						num += value.Length;
					}
					if (num < 0)
					{
						num = 0;
					}
					if (var3 == null)
					{
						num2 = value.Length;
					}
					if (num2 < 0)
					{
						num2 += value.Length;
					}
					if (num2 > value.Length)
					{
						num2 = value.Length;
					}
					if (num < value.Length && num2 - num > 0)
					{
						return new Intrinsic.Result(value.Substring(num, num2 - num));
					}
				}
				return Intrinsic.Result.Null;
			};
			Intrinsic intrinsic27 = Intrinsic.Create("sort");
			intrinsic27.AddParam("self", null);
			intrinsic27.AddParam("byKey", null);
			intrinsic27.code = delegate(TAC.Context context, Intrinsic.Result partialResult)
			{
				Value var = context.GetVar("self");
				ValList valList = var as ValList;
				if (valList == null || valList.values.Count < 2)
				{
					return new Intrinsic.Result(var, true);
				}
				Value var2 = context.GetVar("byKey");
				if (var2 == null)
				{
					valList.values = valList.values.OrderBy((Value arg) => arg, ValueSorter.instance).ToList<Value>();
				}
				else
				{
					int count = valList.values.Count;
					Intrinsics.KeyedValue[] array = new Intrinsics.KeyedValue[count];
					for (int i = 0; i < count; i++)
					{
						array[i].value = valList.values[i];
					}
					int num = var2.IntValue();
					for (int j = 0; j < count; j++)
					{
						Value value = valList.values[j];
						if (value is ValMap)
						{
							array[j].sortKey = ((ValMap)value).Lookup(var2);
						}
						else if (value is ValList)
						{
							ValList valList2 = (ValList)value;
							if (num > -valList2.values.Count && num < valList2.values.Count)
							{
								array[j].sortKey = valList2.values[num];
							}
							else
							{
								array[j].sortKey = null;
							}
						}
					}
					IEnumerable<Intrinsics.KeyedValue> enumerable = array.OrderBy((Intrinsics.KeyedValue arg) => arg.sortKey, ValueSorter.instance);
					int num2 = 0;
					foreach (Intrinsics.KeyedValue keyedValue in enumerable)
					{
						valList.values[num2++] = keyedValue.value;
					}
				}
				return new Intrinsic.Result(valList, true);
			};
			Intrinsic intrinsic28 = Intrinsic.Create("sqrt");
			intrinsic28.AddParam("x", 0.0);
			intrinsic28.code = delegate(TAC.Context context, Intrinsic.Result partialResult)
			{
				Value var = context.GetVar("x");
				if (var == null)
				{
					throw new RuntimeException("sqrt invalid argument (null)");
				}
				return new Intrinsic.Result(Math.Sqrt(var.DoubleValue()));
			};
			Intrinsic intrinsic29 = Intrinsic.Create("str");
			intrinsic29.AddParam("x", ValString.empty);
			intrinsic29.code = delegate(TAC.Context context, Intrinsic.Result partialResult)
			{
				Value var = context.GetVar("x");
				return new Intrinsic.Result((var != null) ? var.ToString() : "null");
			};
			Intrinsic intrinsic30 = Intrinsic.Create("shuffle");
			intrinsic30.AddParam("self", null);
			intrinsic30.code = delegate(TAC.Context context, Intrinsic.Result partialResult)
			{
				Value var = context.GetVar("self");
				if (Intrinsics.random == null)
				{
					Intrinsics.random = new Random();
				}
				if (var is GreyMap)
				{
					return Intrinsic.Result.Null;
				}
				if (var is ValList)
				{
					List<Value> values = ((ValList)var).values;
					if (values.Count > 10000)
					{
						throw new LimitExceededException("shuffle: list too large");
					}
					for (int i = values.Count - 1; i >= 1; i--)
					{
						int index = Intrinsics.random.Next(i + 1);
						Value value = values[index];
						values[index] = values[i];
						values[i] = value;
					}
				}
				else if (var is ValMap)
				{
					Dictionary<Value, Value> map = ((ValMap)var).map;
					if (map.Count > 10000)
					{
						throw new LimitExceededException("shuffle: map too large");
					}
					List<Value> list = map.Keys.ToList<Value>();
					for (int j = list.Count - 1; j >= 1; j--)
					{
						int index2 = Intrinsics.random.Next(j + 1);
						Value key = list[j];
						Value key2 = list[index2];
						Value value2 = map[key2];
						map[key2] = map[key];
						map[key] = value2;
					}
				}
				return Intrinsic.Result.Null;
			};
			Intrinsic intrinsic31 = Intrinsic.Create("sum");
			intrinsic31.AddParam("self", null);
			intrinsic31.code = delegate(TAC.Context context, Intrinsic.Result partialResult)
			{
				Value var = context.GetVar("self");
				double num = 0.0;
				if (var is ValList)
				{
					using (List<Value>.Enumerator enumerator = ((ValList)var).values.GetEnumerator())
					{
						while (enumerator.MoveNext())
						{
							Value value = enumerator.Current;
							num += value.DoubleValue();
						}
						goto IL_A8;
					}
				}
				if (var is ValMap)
				{
					foreach (Value value2 in ((ValMap)var).map.Values)
					{
						num += value2.DoubleValue();
					}
				}
				IL_A8:
				return new Intrinsic.Result(num);
			};
			Intrinsic intrinsic32 = Intrinsic.Create("tan");
			intrinsic32.AddParam("radians", 0.0);
			intrinsic32.code = ((TAC.Context context, Intrinsic.Result partialResult) => new Intrinsic.Result(Math.Tan(context.GetVar("radians").DoubleValue())));
			Intrinsic.Create("time").code = ((TAC.Context context, Intrinsic.Result partialResult) => new Intrinsic.Result(context.vm.runTime));
			Intrinsic intrinsic33 = Intrinsic.Create("upper");
			intrinsic33.AddParam("self", null);
			intrinsic33.code = delegate(TAC.Context context, Intrinsic.Result partialResult)
			{
				Value var = context.GetVar("self");
				if (var is ValString)
				{
					return new Intrinsic.Result(((ValString)var).value.ToUpper());
				}
				return new Intrinsic.Result(var, true);
			};
			Intrinsic intrinsic34 = Intrinsic.Create("val");
			intrinsic34.AddParam("self", 0.0);
			intrinsic34.code = delegate(TAC.Context context, Intrinsic.Result partialResult)
			{
				Value var = context.GetVar("self");
				if (var is ValNumber)
				{
					return new Intrinsic.Result(var, true);
				}
				if (var is ValString)
				{
					double resultNum = 0.0;
					double.TryParse(var.ToString(), out resultNum);
					return new Intrinsic.Result(resultNum);
				}
				return Intrinsic.Result.Null;
			};
			Intrinsic intrinsic35 = Intrinsic.Create("values");
			intrinsic35.AddParam("self", null);
			intrinsic35.code = delegate(TAC.Context context, Intrinsic.Result partialResult)
			{
				Value var = context.GetVar("self");
				if (var is ValMap)
				{
					return new Intrinsic.Result(new ValList(new List<Value>(((ValMap)var).map.Values)), true);
				}
				if (var is ValString)
				{
					string value = ((ValString)var).value;
					List<Value> list = new List<Value>(value.Length);
					for (int i = 0; i < value.Length; i++)
					{
						list.Add(TAC.Str(value[i].ToString()));
					}
					return new Intrinsic.Result(new ValList(list), true);
				}
				return new Intrinsic.Result(var, true);
			};
			Intrinsic intrinsic36 = Intrinsic.Create("wait");
			intrinsic36.AddParam("seconds", 1.0);
			intrinsic36.code = delegate(TAC.Context context, Intrinsic.Result partialResult)
			{
				if (context.interpreter.Paused())
				{
					return Intrinsic.Result.Waiting;
				}
				if (partialResult != null && !partialResult.done)
				{
					return Intrinsic.Result.Null;
				}
				ValNumber valNumber = context.GetVar("seconds") as ValNumber;
				if (valNumber == null)
				{
					throw new RuntimeException("wait: Invalid arguments");
				}
				float num = valNumber.FloatValue();
				if (num < 0.1f || num > 300f)
				{
					throw new RuntimeException("wait: time must have a value between 0.1 and 300");
				}
				GreyInterpreter greyInterpreter = (GreyInterpreter)context.interpreter;
				Player player = (Player)greyInterpreter.hostData;
				int terminalPID = greyInterpreter.terminalPID;
				player.GetHelperScript(terminalPID).SetPendingWait(context.vm, num);
				context.vm.pause = true;
				return Intrinsic.Result.Waiting;
			};
			Intrinsic intrinsic37 = Intrinsic.Create("bitwise");
			intrinsic37.AddParam("operator", null);
			intrinsic37.AddParam("num1", null);
			intrinsic37.AddParam("num2", null);
			intrinsic37.code = delegate(TAC.Context context, Intrinsic.Result partialResult)
			{
				ValString valString = context.GetVar("operator") as ValString;
				ValNumber valNumber = context.GetVar("num1") as ValNumber;
				ValNumber valNumber2 = context.GetVar("num2") as ValNumber;
				if (valString == null || valNumber == null)
				{
					return Intrinsic.Result.Null;
				}
				string value = valString.value;
				int num = valNumber.IntValue();
				if (value == "~")
				{
					return new Intrinsic.Result((double)(~(double)num));
				}
				if (valNumber2 == null)
				{
					return Intrinsic.Result.Null;
				}
				int num2 = valNumber2.IntValue();
				if (value == "&")
				{
					return new Intrinsic.Result((double)(num & num2));
				}
				if (value == "|")
				{
					return new Intrinsic.Result((double)(num | num2));
				}
				if (value == "^")
				{
					return new Intrinsic.Result((double)(num ^ num2));
				}
				if (value == "<<")
				{
					return new Intrinsic.Result((double)(num << num2));
				}
				if (value == ">>")
				{
					return new Intrinsic.Result((double)(num >> num2));
				}
				if (value == ">>>")
				{
					return new Intrinsic.Result((double)((uint)num >> num2));
				}
				return Intrinsic.Result.Null;
			};
		}

		// Token: 0x060044B1 RID: 17585 RVA: 0x0010A2F0 File Offset: 0x001084F0
		public static void CompileSlice(List<TAC.Line> code, Value list, Value fromIdx, Value toIdx, int resultTempNum)
		{
			code.Add(new TAC.Line(null, TAC.Line.Op.PushParam, list, null));
			code.Add(new TAC.Line(null, TAC.Line.Op.PushParam, (fromIdx == null) ? TAC.Num(0.0) : fromIdx, null));
			code.Add(new TAC.Line(null, TAC.Line.Op.PushParam, toIdx, null));
			ValFunction func = Intrinsic.GetByName("slice").GetFunc();
			code.Add(new TAC.Line(TAC.LTemp(resultTempNum), TAC.Line.Op.CallFunctionA, func, TAC.Num(3.0)));
		}

		// Token: 0x060044B2 RID: 17586 RVA: 0x0010A374 File Offset: 0x00108574
		public static ValMap ListType()
		{
			if (Intrinsics._listType == null)
			{
				Intrinsics._listType = new ValMap();
				Intrinsics._listType["hasIndex"] = Intrinsic.GetByName("hasIndex").GetFunc();
				Intrinsics._listType["indexes"] = Intrinsic.GetByName("indexes").GetFunc();
				Intrinsics._listType["indexOf"] = Intrinsic.GetByName("indexOf").GetFunc();
				Intrinsics._listType["len"] = Intrinsic.GetByName("len").GetFunc();
				Intrinsics._listType["pop"] = Intrinsic.GetByName("pop").GetFunc();
				Intrinsics._listType["pull"] = Intrinsic.GetByName("pull").GetFunc();
				Intrinsics._listType["push"] = Intrinsic.GetByName("push").GetFunc();
				Intrinsics._listType["shuffle"] = Intrinsic.GetByName("shuffle").GetFunc();
				Intrinsics._listType["sort"] = Intrinsic.GetByName("sort").GetFunc();
				Intrinsics._listType["sum"] = Intrinsic.GetByName("sum").GetFunc();
				Intrinsics._listType["remove"] = Intrinsic.GetByName("remove").GetFunc();
				Intrinsics._listType["values"] = Intrinsic.GetByName("values").GetFunc();
				Intrinsics._listType["reverse"] = Intrinsic.GetByName("reverse").GetFunc();
				Intrinsics._listType["join"] = Intrinsic.GetByName("join").GetFunc();
			}
			return Intrinsics._listType;
		}

		// Token: 0x060044B3 RID: 17587 RVA: 0x0010A540 File Offset: 0x00108740
		public static ValMap StringType()
		{
			if (Intrinsics._stringType == null)
			{
				Intrinsics._stringType = new ValMap();
				Intrinsics._stringType["hasIndex"] = Intrinsic.GetByName("hasIndex").GetFunc();
				Intrinsics._stringType["indexes"] = Intrinsic.GetByName("indexes").GetFunc();
				Intrinsics._stringType["indexOf"] = Intrinsic.GetByName("indexOf").GetFunc();
				Intrinsics._stringType["code"] = Intrinsic.GetByName("code").GetFunc();
				Intrinsics._stringType["len"] = Intrinsic.GetByName("len").GetFunc();
				Intrinsics._stringType["lower"] = Intrinsic.GetByName("lower").GetFunc();
				Intrinsics._stringType["val"] = Intrinsic.GetByName("val").GetFunc();
				Intrinsics._stringType["remove"] = Intrinsic.GetByName("remove").GetFunc();
				Intrinsics._stringType["upper"] = Intrinsic.GetByName("upper").GetFunc();
				Intrinsics._stringType["values"] = Intrinsic.GetByName("values").GetFunc();
				Intrinsics._stringType["split"] = Intrinsic.GetByName("split").GetFunc();
				Intrinsics._stringType["replace"] = Intrinsic.GetByName("replace").GetFunc();
				Intrinsics._stringType["trim"] = Intrinsic.GetByName("trim").GetFunc();
				Intrinsics._stringType["lastIndexOf"] = Intrinsic.GetByName("lastIndexOf").GetFunc();
				Intrinsics._stringType["to_int"] = Intrinsic.GetByName("to_int").GetFunc();
			}
			return Intrinsics._stringType;
		}

		// Token: 0x060044B4 RID: 17588 RVA: 0x0010A728 File Offset: 0x00108928
		public static ValMap MapType()
		{
			if (Intrinsics._mapType == null)
			{
				Intrinsics._mapType = new ValMap();
				Intrinsics._mapType["hasIndex"] = Intrinsic.GetByName("hasIndex").GetFunc();
				Intrinsics._mapType["indexes"] = Intrinsic.GetByName("indexes").GetFunc();
				Intrinsics._mapType["indexOf"] = Intrinsic.GetByName("indexOf").GetFunc();
				Intrinsics._mapType["len"] = Intrinsic.GetByName("len").GetFunc();
				Intrinsics._mapType["pop"] = Intrinsic.GetByName("pop").GetFunc();
				Intrinsics._mapType["push"] = Intrinsic.GetByName("push").GetFunc();
				Intrinsics._mapType["shuffle"] = Intrinsic.GetByName("shuffle").GetFunc();
				Intrinsics._mapType["sum"] = Intrinsic.GetByName("sum").GetFunc();
				Intrinsics._mapType["remove"] = Intrinsic.GetByName("remove").GetFunc();
				Intrinsics._mapType["values"] = Intrinsic.GetByName("values").GetFunc();
			}
			return Intrinsics._mapType;
		}

		// Token: 0x04001E54 RID: 7764
		private static bool initialized;

		// Token: 0x04001E55 RID: 7765
		private static Random random;

		// Token: 0x04001E56 RID: 7766
		private static ValMap _listType;

		// Token: 0x04001E57 RID: 7767
		private static ValMap _stringType;

		// Token: 0x04001E58 RID: 7768
		private static ValMap _mapType;

		// Token: 0x02000C04 RID: 3076
		private struct KeyedValue
		{
			// Token: 0x04002A58 RID: 10840
			public Value sortKey;

			// Token: 0x04002A59 RID: 10841
			public Value value;
		}
	}
}
