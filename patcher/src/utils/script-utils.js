/* globals xelib */

class ScriptUtils {
  static addScript (record, scriptName) {
    if (!xelib.HasElement(record, 'VMAD - Virtual Machine Adapter')) {
      const vmad = xelib.AddElement(record, 'VMAD - Virtual Machine Adapter')
      xelib.SetIntValue(vmad, 'Version', 5)
      xelib.SetIntValue(vmad, 'Object Format', 2)
    }
    return xelib.AddScript(record, scriptName, 'Local')
  }

  static addIntProperty (script, propertyName, int) {
    const property = xelib.AddScriptProperty(script, propertyName, 'Int32',
      'Edited')
    xelib.SetIntValue(property, 'Value', int)
    return property
  }

  static addFloatProperty (script, propertyName, float) {
    const property = xelib.AddScriptProperty(script, propertyName, 'Float',
      'Edited')
    xelib.SetFloatValue(property, 'Value', float)
    return property
  }

  static addBoolProperty (script, propertyName, bool) {
    const property = xelib.AddScriptProperty(script, propertyName, 'Bool',
      'Edited')
    xelib.SetValue(property, 'Value', bool ? 'True' : 'False')
    return property
  }

  static addStringProperty (script, propertyName, string) {
    const property = xelib.AddScriptProperty(script, propertyName, 'String',
      'Edited')
    xelib.SetValue(property, 'Value', string)
    return property
  }

  static addObjectProperty (script, propertyName, formID) {
    const property = xelib.AddScriptProperty(script, propertyName, 'Object',
      'Edited')
    const v2Path   = 'Value\\Object Union\\Object v2\\'
    xelib.SetUIntValue(property, v2Path + 'FormID', formID)
    xelib.SetIntValue(property, v2Path + 'Alias', -1)
    return property
  }

  static addPlayerProperty (script) {
    this.addObjectProperty(script, 'PlayerRef', 0x14)
  }
}
