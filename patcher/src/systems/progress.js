class Progress {
  static factor = 1000

  static maxProgress   = 0
  static floatProgress = 0
  static nextFullInt   = 0
  static intProgress   = 0

  static setMax (amount) {
    this.maxProgress   = amount * this.factor
    this.floatProgress = 0
    this.nextFullInt   = 0
    this.intProgress   = 0
    return this.maxProgress
  }

  static add (amount) {
    this.floatProgress += amount * this.factor
    this.nextFullInt += amount * this.factor
    const addProgress = Math.floor(this.nextFullInt)
    if (addProgress > 0) {
      globals.helpers.addProgress(addProgress)
      this.nextFullInt -= addProgress
      this.intProgress += addProgress
    }
  }

  static complete () {
    const addProgress = this.maxProgress - this.intProgress
    globals.helpers.addProgress(addProgress)
  }
}
