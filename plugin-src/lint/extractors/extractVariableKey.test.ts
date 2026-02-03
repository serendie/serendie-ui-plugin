import extractVariableKey from './extractVariableKey'

describe('extractVariableKey', () => {
  describe('プレフィックス付きの入力', () => {
    it('VariableID:プレフィックス付きでスラッシュ区切りがある場合', () => {
      const input =
        'VariableID:4939614180d38f907204f1cd47dbcf7cec6f8b80/17973:518'
      const result = extractVariableKey(input)
      expect(result).toBe('4939614180d38f907204f1cd47dbcf7cec6f8b80')
    })

    it('CollectionID:プレフィックス付きでスラッシュ区切りがある場合', () => {
      const input =
        'CollectionID:4939614180d38f907204f1cd47dbcf7cec6f8b80/17973:518'
      const result = extractVariableKey(input)
      expect(result).toBe('4939614180d38f907204f1cd47dbcf7cec6f8b80')
    })

    it('VariableID:プレフィックス付きでスラッシュ区切りがない場合', () => {
      const input = 'VariableID:4939614180d38f907204f1cd47dbcf7cec6f8b80'
      const result = extractVariableKey(input)
      expect(result).toBe('4939614180d38f907204f1cd47dbcf7cec6f8b80')
    })

    it('その他のID:プレフィックス（CustomID:など）', () => {
      const input = 'CustomID:abc123def456/some:path'
      const result = extractVariableKey(input)
      expect(result).toBe('abc123def456')
    })
  })

  describe('プレフィックスなしの入力', () => {
    it('スラッシュ区切りがある場合', () => {
      const input = '4939614180d38f907204f1cd47dbcf7cec6f8b80/17973:518'
      const result = extractVariableKey(input)
      expect(result).toBe('4939614180d38f907204f1cd47dbcf7cec6f8b80')
    })

    it('スラッシュ区切りがない場合', () => {
      const input = '4939614180d38f907204f1cd47dbcf7cec6f8b80'
      const result = extractVariableKey(input)
      expect(result).toBe('4939614180d38f907204f1cd47dbcf7cec6f8b80')
    })
  })

  describe('大文字小文字の処理', () => {
    it('大文字を含む16進数の場合', () => {
      const input = 'ABC123DEF456/path'
      const result = extractVariableKey(input)
      expect(result).toBe('ABC123DEF456')
    })

    it('混在する場合', () => {
      const input = 'VariableID:AbC123dEf456'
      const result = extractVariableKey(input)
      expect(result).toBe('AbC123dEf456')
    })
  })

  describe('エッジケース', () => {
    it('空文字列の場合', () => {
      const result = extractVariableKey('')
      expect(result).toBeNull()
    })

    it('16進数以外の文字を含む場合', () => {
      const input = 'VariableID:xyz123/path'
      const result = extractVariableKey(input)
      expect(result).toBeNull()
    })

    it('スラッシュから始まる場合', () => {
      const input = '/4939614180d38f907204f1cd47dbcf7cec6f8b80'
      const result = extractVariableKey(input)
      expect(result).toBeNull()
    })

    it('プレフィックスのみの場合', () => {
      const input = 'VariableID:'
      const result = extractVariableKey(input)
      expect(result).toBeNull()
    })

    it('複数のスラッシュがある場合', () => {
      const input = 'abc123/def456/ghi789'
      const result = extractVariableKey(input)
      expect(result).toBe('abc123')
    })
  })

  describe('異なる長さの16進数キー', () => {
    it('短いキー（8文字）', () => {
      const input = 'abc12345/path'
      const result = extractVariableKey(input)
      expect(result).toBe('abc12345')
    })

    it('長いキー（64文字）', () => {
      const input =
        '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef/path'
      const result = extractVariableKey(input)
      expect(result).toBe(
        '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
      )
    })
  })

  describe('ローカル変数形式', () => {
    it('VariableID:プレフィックス付きのローカル変数形式', () => {
      const input = 'VariableID:4776:34700'
      const result = extractVariableKey(input)
      expect(result).toBe('4776:34700')
    })

    it('プレフィックスなしのローカル変数形式', () => {
      const input = '4776:34700'
      const result = extractVariableKey(input)
      expect(result).toBe('4776:34700')
    })

    it('CollectionID:プレフィックス付きのローカル変数形式', () => {
      const input = 'CollectionID:123:456'
      const result = extractVariableKey(input)
      expect(result).toBe('123:456')
    })
  })
})
