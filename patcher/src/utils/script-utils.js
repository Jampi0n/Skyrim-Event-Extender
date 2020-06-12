/* globals xelib */

class ScriptUtils {
  /**
   *
   * @param record
   * @param scriptName
   * @return {Number}
   */
  static addScript (record, scriptName) {
    if (!xelib.HasElement(record, 'VMAD - Virtual Machine Adapter')) {
      const vmad = xelib.AddElement(record, 'VMAD - Virtual Machine Adapter')
      xelib.SetIntValue(vmad, 'Version', 5)
      xelib.SetIntValue(vmad, 'Object Format', 2)
    }
    return xelib.AddScript(record, scriptName, 'Local')
  }

  /**
   *
   * @param script
   * @param propertyName
   * @param int
   * @return {Number}
   */
  static addIntProperty (script, propertyName, int) {
    const property = xelib.AddScriptProperty(script, propertyName, 'Int32',
      'Edited')
    xelib.SetIntValue(property, 'Value', int)
    return property
  }

  /**
   *
   * @param script
   * @param propertyName
   * @param float
   * @return {Number}
   */
  static addFloatProperty (script, propertyName, float) {
    const property = xelib.AddScriptProperty(script, propertyName, 'Float',
      'Edited')
    xelib.SetFloatValue(property, 'Value', float)
    return property
  }

  /**
   *
   * @param script
   * @param propertyName
   * @param bool
   * @return {Number}
   */
  static addBoolProperty (script, propertyName, bool) {
    const property = xelib.AddScriptProperty(script, propertyName, 'Bool',
      'Edited')
    xelib.SetValue(property, 'Value', bool ? 'True' : 'False')
    return property
  }

  /**
   *
   * @param script
   * @param propertyName
   * @param string
   * @return {Number}
   */
  static addStringProperty (script, propertyName, string) {
    const property = xelib.AddScriptProperty(script, propertyName, 'String',
      'Edited')
    xelib.SetValue(property, 'Value', string)
    return property
  }

  /**
   *
   * @param script
   * @param propertyName
   * @param formID
   * @return {Number}
   */
  static addObjectProperty (script, propertyName, formID) {
    const property = xelib.AddScriptProperty(script, propertyName, 'Object',
      'Edited')
    const v2Path   = 'Value\\Object Union\\Object v2\\'
    xelib.SetUIntValue(property, v2Path + 'FormID', formID)
    xelib.SetIntValue(property, v2Path + 'Alias', -1)
    return property
  }

  /**
   *
   * @param script
   */
  static addPlayerProperty (script) {
    this.addObjectProperty(script, 'PlayerRef', 0x14)
  }
}
